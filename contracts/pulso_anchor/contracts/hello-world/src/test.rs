#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

#[test]
fn open_and_ack() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(PulsoAnchor, ());
    let client = PulsoAnchorClient::new(&env, &contract_id);
    client.initialize(&admin);

    let case_key = BytesN::from_array(&env, &[7u8; 32]);
    let commitment = BytesN::from_array(&env, &[9u8; 32]);
    client.record_event(&case_key, &1, &(EventCode::Opened as u32), &1_700_000_000, &commitment);
    client.record_event(
        &case_key,
        &2,
        &(EventCode::FamilyAck as u32),
        &1_700_000_100,
        &commitment,
    );
    let state = client.get_case_state(&case_key);
    assert_eq!(state.last_seq, 2);
    assert!(!state.closed);
}
