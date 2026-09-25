-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'FAMILY', 'ADMIN');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "SourceChannel" AS ENUM ('esp32', 'web');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('created', 'family_acknowledged', 'contacting', 'resolved', 'false_alarm');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('queued', 'sent', 'failed', 'acknowledged');

-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('open', 'acknowledged', 'closed');

-- CreateEnum
CREATE TYPE "ChainAnchorStatus" AS ENUM ('pending', 'submitted', 'confirmed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "pollar_subject" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "phone" TEXT,
    "address_encrypted" TEXT,
    "consent_version" TEXT NOT NULL,
    "is_demo_identity" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_backup" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "permissions" TEXT NOT NULL DEFAULT 'ack,view_incident',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "secret_ref" TEXT NOT NULL,
    "last_counter" BIGINT NOT NULL DEFAULT 0,
    "last_seen_at" TIMESTAMP(3),
    "status" "DeviceStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_events" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "counter" BIGINT NOT NULL,
    "device_pressed_at_utc" TIMESTAMP(3),
    "server_received_at_utc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_ip_encrypted" TEXT,
    "source_channel" "SourceChannel" NOT NULL,

    CONSTRAINT "device_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'created',
    "opened_at_utc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at_utc" TIMESTAMP(3),
    "address_snapshot_encrypted" TEXT,
    "case_key" TEXT NOT NULL,
    "is_simulation" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_events" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "actor_id" TEXT,
    "server_received_at_utc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_private" TEXT,

    CONSTRAINT "incident_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" "NotificationStatus" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "provider_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_checkins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "local_day" DATE NOT NULL,
    "answers_encrypted" TEXT NOT NULL,
    "score_version" TEXT,
    "score_0_100" INTEGER,
    "completed_at_utc" TIMESTAMP(3),
    "share_scope" TEXT NOT NULL DEFAULT 'self',

    CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "checkin_id" TEXT,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'open',
    "created_at_utc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at_utc" TIMESTAMP(3),

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_anchors" (
    "id" TEXT NOT NULL,
    "incident_event_id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "tx_hash" TEXT,
    "network" TEXT NOT NULL DEFAULT 'testnet',
    "ledger_closed_at_utc" TIMESTAMP(3),
    "status" "ChainAnchorStatus" NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "commitment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chain_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_pollar_subject_key" ON "users"("pollar_subject");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "contacts_user_id_idx" ON "contacts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_public_id_key" ON "devices"("public_id");

-- CreateIndex
CREATE INDEX "devices_user_id_idx" ON "devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_events_event_id_key" ON "device_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_events_device_id_counter_key" ON "device_events"("device_id", "counter");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_case_key_key" ON "incidents"("case_key");

-- CreateIndex
CREATE INDEX "incidents_user_id_status_idx" ON "incidents"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "incident_events_incident_id_seq_key" ON "incident_events"("incident_id", "seq");

-- CreateIndex
CREATE INDEX "notifications_incident_id_idx" ON "notifications"("incident_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_checkins_user_id_local_day_key" ON "daily_checkins"("user_id", "local_day");

-- CreateIndex
CREATE INDEX "chain_anchors_incident_id_status_idx" ON "chain_anchors"("incident_id", "status");

-- CreateIndex
CREATE INDEX "audit_log_object_type_object_id_idx" ON "audit_log"("object_type", "object_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_events" ADD CONSTRAINT "device_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_events" ADD CONSTRAINT "incident_events_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_checkin_id_fkey" FOREIGN KEY ("checkin_id") REFERENCES "daily_checkins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_anchors" ADD CONSTRAINT "chain_anchors_incident_event_id_fkey" FOREIGN KEY ("incident_event_id") REFERENCES "incident_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_anchors" ADD CONSTRAINT "chain_anchors_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
