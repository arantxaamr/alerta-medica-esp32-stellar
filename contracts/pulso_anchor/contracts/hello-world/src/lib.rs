#![no_std]
use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, Address, BytesN, Env,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Case(BytesN<32>),
}

#[contracttype]
#[derive(Clone)]
pub struct CaseState {
    pub last_seq: u32,
    pub closed: bool,
}

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum EventCode {
    Opened = 1,
    FamilyAck = 2,
    Closed = 3,
    FalseAlarm = 4,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IncidentAnchored {
    #[topic]
    pub case_key: BytesN<32>,
    pub seq: u32,
    pub event_code: u32,
    pub server_received_at_unix: u64,
    pub commitment: BytesN<32>,
}

#[contract]
pub struct PulsoAnchor;

#[contractimpl]
impl PulsoAnchor {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn record_event(
        env: Env,
        case_key: BytesN<32>,
        seq: u32,
        event_code: u32,
        server_received_at_unix: u64,
        commitment: BytesN<32>,
    ) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        if server_received_at_unix == 0 {
            panic!("invalid timestamp");
        }

        let key = DataKey::Case(case_key.clone());
        let mut state = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(CaseState {
                last_seq: 0,
                closed: false,
            });

        if state.closed {
            panic!("case closed");
        }
        if seq != state.last_seq + 1 {
            panic!("bad seq");
        }
        if seq == 1 && event_code != EventCode::Opened as u32 {
            panic!("first event must be OPENED");
        }
        if seq > 1 && event_code == EventCode::Opened as u32 {
            panic!("OPENED only once");
        }

        state.last_seq = seq;
        if event_code == EventCode::Closed as u32 || event_code == EventCode::FalseAlarm as u32 {
            state.closed = true;
        }
        env.storage().persistent().set(&key, &state);

        IncidentAnchored {
            case_key,
            seq,
            event_code,
            server_received_at_unix,
            commitment,
        }
        .publish(&env);
    }

    pub fn get_case_state(env: Env, case_key: BytesN<32>) -> CaseState {
        env.storage()
            .persistent()
            .get(&DataKey::Case(case_key))
            .unwrap_or(CaseState {
                last_seq: 0,
                closed: false,
            })
    }

    pub fn admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized")
    }
}

mod test;
