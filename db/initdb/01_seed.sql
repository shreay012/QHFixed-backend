--
-- PostgreSQL database dump
--

\restrict NoUcpRdsZSdPwk0ud28DUOztftz6gOIAZ6g49Mwlv9TJ3CPzSQDI0hndLnafDjs

-- Dumped from database version 16.13 (Homebrew)
-- Dumped by pg_dump version 16.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: booking_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_histories (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: chat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: chatbot_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chatbot_logs (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: cms_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_articles (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: cms_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_banners (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: cms_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_content (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    _id character(24) NOT NULL,
    code character varying(2) NOT NULL,
    name jsonb NOT NULL,
    currency character varying(3),
    supported_langs jsonb,
    config jsonb,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    _id character(24) NOT NULL,
    code character varying(3) NOT NULL,
    name character varying(50),
    symbol character varying(4),
    decimals integer DEFAULT 2,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fcm_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fcm_tokens (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: fx_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_rates (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: geo_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_pricing (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: idempotency; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idempotency (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: legal_acceptances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_acceptances (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_documents (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_templates (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payouts (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: promo_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_redemptions (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refunds (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: reschedule_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reschedule_history (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: resource_deliverables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_deliverables (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: resource_time_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_time_logs (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: resource_work_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_work_updates (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    _id character(24) NOT NULL,
    slug character varying(100) NOT NULL,
    name jsonb NOT NULL,
    tagline jsonb,
    description jsonb,
    category character varying(64),
    category_name jsonb,
    technologies jsonb,
    pricing jsonb,
    highlights jsonb,
    inclusions jsonb,
    not_included jsonb,
    faq jsonb,
    hourly_rate integer,
    currency character varying(3),
    min_hours integer,
    max_hours integer,
    image text,
    icon_url text,
    sort_order integer DEFAULT 999,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    _id character(24) NOT NULL,
    user_id character(24) NOT NULL,
    refresh_token_hash character varying(200) NOT NULL,
    ip character varying(64),
    ua text,
    revoked boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_config (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: ticket_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_messages (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: tips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tips (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.translations (
    _id character(24) NOT NULL,
    data jsonb NOT NULL,
    country character varying(2),
    status character varying(64),
    user_id character(24),
    pm_id character(24),
    resource_id character(24),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    _id character(24) NOT NULL,
    mobile character varying(20),
    email character varying(200),
    name character varying(200),
    role character varying(32) DEFAULT 'user'::character varying NOT NULL,
    country character varying(2),
    parent_country_admin_id character(24),
    managed_countries jsonb,
    fcm_tokens jsonb,
    specialization jsonb,
    skills jsonb,
    meta jsonb,
    history jsonb,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa51624729f95617814e1	{"at": "2026-04-24T02:19:02.675Z", "ip": "127.0.0.1", "_id": "69faa51624729f95617814e1", "action": "USER_CREATED", "actorId": "69faa5134e1d6b9cb1e2c750", "resource": "user", "resourceId": "69faa5134e1d6b9cb1e2c755"}	\N	\N	\N	\N	69faa5134e1d6b9cb1e2c755	\N	\N
69faa51624729f95617814e2	{"at": "2026-04-24T02:19:02.675Z", "ip": "127.0.0.1", "_id": "69faa51624729f95617814e2", "action": "BOOKING_CREATED", "actorId": "69faa5134e1d6b9cb1e2c755", "resource": "booking", "resourceId": "69faa51424729f95617814de"}	\N	\N	\N	\N	69faa51424729f95617814de	\N	\N
69faa51624729f95617814e3	{"at": "2026-04-24T02:19:02.675Z", "ip": "127.0.0.1", "_id": "69faa51624729f95617814e3", "action": "PAYMENT_SUCCESS", "actorId": "69faa5134e1d6b9cb1e2c755", "resource": "payment", "resourceId": "69faa51424729f95617814de"}	\N	\N	\N	\N	69faa51424729f95617814de	\N	\N
69faa51624729f95617814e4	{"at": "2026-04-26T02:19:02.675Z", "ip": "127.0.0.1", "_id": "69faa51624729f95617814e4", "action": "BOOKING_STARTED", "actorId": "69faa5134e1d6b9cb1e2c751", "resource": "booking", "resourceId": "69faa51424729f95617814de"}	\N	\N	\N	\N	69faa51424729f95617814de	\N	\N
69faa51624729f95617814e5	{"at": "2026-04-27T02:19:02.675Z", "ip": "127.0.0.1", "_id": "69faa51624729f95617814e5", "action": "BOOKING_COMPLETED", "actorId": "69faa5134e1d6b9cb1e2c751", "resource": "booking", "resourceId": "69faa51424729f95617814de"}	\N	\N	\N	\N	69faa51424729f95617814de	\N	\N
69fadab8e8408cd6d70ee6b3	{"at": "2026-05-06T06:07:52.906Z", "ip": "185.177.229.168", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fadab8e8408cd6d70ee6b3", "body": {"pmId": "69faa5134e1d6b9cb1e2c751"}, "path": "/admin/bookings/69fada78e8408cd6d70ee6b0/assign-pm", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fadaaae8408cd6d70ee6b2"}, "query": {}, "method": "POST", "params": {"id": "69fada78e8408cd6d70ee6b0"}, "durationMs": 80, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fadacce8408cd6d70ee6b7	{"at": "2026-05-06T06:08:12.174Z", "ip": "185.177.229.168", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fadacce8408cd6d70ee6b7", "body": {"msg": "Hello"}, "path": "/admin/bookings/69fada78e8408cd6d70ee6b0/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fadaaae8408cd6d70ee6b2"}, "query": {}, "method": "POST", "params": {"id": "69fada78e8408cd6d70ee6b0"}, "durationMs": 64, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fadaede8408cd6d70ee6bb	{"at": "2026-05-06T06:08:45.840Z", "ip": "185.177.229.168", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fadaede8408cd6d70ee6bb", "body": {"msg": "hello"}, "path": "/admin/bookings/69fada78e8408cd6d70ee6b0/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fadaaae8408cd6d70ee6b2"}, "query": {}, "method": "POST", "params": {"id": "69fada78e8408cd6d70ee6b0"}, "durationMs": 58, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fae89c75ed7035320450d3	{"at": "2026-04-24T07:07:08.476Z", "ip": "127.0.0.1", "_id": "69fae89c75ed7035320450d3", "action": "USER_CREATED", "actorId": "69faa5134e1d6b9cb1e2c750", "resource": "user", "resourceId": "69faa5134e1d6b9cb1e2c755"}	\N	\N	\N	\N	69faa5134e1d6b9cb1e2c755	\N	\N
69fae89c75ed7035320450d4	{"at": "2026-04-24T07:07:08.476Z", "ip": "127.0.0.1", "_id": "69fae89c75ed7035320450d4", "action": "BOOKING_CREATED", "actorId": "69faa5134e1d6b9cb1e2c755", "resource": "booking", "resourceId": "69fae89975ed7035320450d0"}	\N	\N	\N	\N	69fae89975ed7035320450d0	\N	\N
69fae89c75ed7035320450d5	{"at": "2026-04-24T07:07:08.476Z", "ip": "127.0.0.1", "_id": "69fae89c75ed7035320450d5", "action": "PAYMENT_SUCCESS", "actorId": "69faa5134e1d6b9cb1e2c755", "resource": "payment", "resourceId": "69fae89975ed7035320450d0"}	\N	\N	\N	\N	69fae89975ed7035320450d0	\N	\N
69fae89c75ed7035320450d6	{"at": "2026-04-26T07:07:08.476Z", "ip": "127.0.0.1", "_id": "69fae89c75ed7035320450d6", "action": "BOOKING_STARTED", "actorId": "69faa5134e1d6b9cb1e2c751", "resource": "booking", "resourceId": "69fae89975ed7035320450d0"}	\N	\N	\N	\N	69fae89975ed7035320450d0	\N	\N
69fae89c75ed7035320450d7	{"at": "2026-04-27T07:07:08.476Z", "ip": "127.0.0.1", "_id": "69fae89c75ed7035320450d7", "action": "BOOKING_COMPLETED", "actorId": "69faa5134e1d6b9cb1e2c751", "resource": "booking", "resourceId": "69fae89975ed7035320450d0"}	\N	\N	\N	\N	69fae89975ed7035320450d0	\N	\N
69faec38e98c8a5737e82d9e	{"at": "2026-05-06T07:22:32.006Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69faec38e98c8a5737e82d9e", "body": {"pmId": "69faa5134e1d6b9cb1e2c751"}, "path": "/admin/bookings/69faebe0e98c8a5737e82d9c/assign-pm", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69faec1ae98c8a5737e82d9d"}, "query": {}, "method": "POST", "params": {"id": "69faebe0e98c8a5737e82d9c"}, "durationMs": 92, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69faec54e98c8a5737e82da3	{"at": "2026-05-06T07:23:00.735Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69faec54e98c8a5737e82da3", "body": {"msg": "hy"}, "path": "/admin/bookings/69faebe0e98c8a5737e82d9c/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69faec1ae98c8a5737e82d9d"}, "query": {}, "method": "POST", "params": {"id": "69faebe0e98c8a5737e82d9c"}, "durationMs": 64, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69faec62e98c8a5737e82da8	{"at": "2026-05-06T07:23:14.296Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69faec62e98c8a5737e82da8", "body": {"msg": "fagklfd"}, "path": "/admin/bookings/69faebe0e98c8a5737e82d9c/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69faec1ae98c8a5737e82d9d"}, "query": {}, "method": "POST", "params": {"id": "69faebe0e98c8a5737e82d9c"}, "durationMs": 52, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69faec79e98c8a5737e82dac	{"at": "2026-05-06T07:23:37.731Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69faec79e98c8a5737e82dac", "body": {"resourceId": "69faa5134e1d6b9cb1e2c753"}, "path": "/admin/bookings/69faebe0e98c8a5737e82d9c/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69faec1ae98c8a5737e82d9d"}, "query": {}, "method": "POST", "params": {"id": "69faebe0e98c8a5737e82d9c"}, "durationMs": 101, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb00d3e98c8a5737e82db1	{"at": "2026-05-06T08:50:27.570Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb00d3e98c8a5737e82db1", "body": {"name": {"ar": "تحسين محركات البحث", "de": "SEO", "en": "SEO", "hi": "SEO"}, "active": true, "tagline": "", "category": "marketing", "imageUrl": "https://placehold.co/600x400?text=SEO", "hourlyRate": 1000, "description": {"ar": "SEO تقني + محتوى + بناء روابط — نمو عضوي مستدام بترتيبات قابلة للقياس.", "de": "Technisches SEO + Content + Linkbuilding — nachhaltiges organisches Wachstum mit messbaren Rankings.", "en": "Technical SEO + content + link-building — sustainable organic growth with measurable rankings.", "hi": "टेक्निकल SEO + कंटेंट + लिंक-बिल्डिंग — मेज़रेबल रैंकिंग के साथ ऑर्गेनिक ग्रोथ।"}, "technologies": [{"name": "SEO Blog Writing"}, {"name": "Search Engine Optimization (SEO)"}, {"name": "Social Media Marketing (SMM)"}, {"name": "Influencer Marketing"}, {"name": "PPC Advertising (Google/Meta Ads)"}, {"name": "Email Marketing Strategy"}, {"name": "Content Marketing"}, {"name": "Performance Marketing"}, {"name": "CRO Expert"}, {"name": "Technical SEO Audits"}]}, "path": "/admin/services/69fafdf1be90555dc5fcc67f", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb009be98c8a5737e82db0"}, "query": {}, "method": "PUT", "params": {"id": "69fafdf1be90555dc5fcc67f"}, "durationMs": 158, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb00e8e98c8a5737e82db2	{"at": "2026-05-06T08:50:48.643Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb00e8e98c8a5737e82db2", "body": {"name": {"ar": "تطوير الذكاء الاصطناعي التوليدي", "de": "Gen AI-Entwicklung", "en": "Gen AI Development", "hi": "Gen AI डेवलपमेंट"}, "active": true, "tagline": "", "category": "ai", "imageUrl": "https://placehold.co/600x400?text=Gen%2BAI%2BDevelopment", "hourlyRate": 1500, "description": {"ar": "تكاملات مخصصة GPT/Claude/Gemini وأنظمة RAG وقواعد بيانات Vector وتحسين نماذج ML للمنتجات.", "de": "Custom-GPT/Claude/Gemini-Integrationen, RAG-Systeme, Vektor-DBs und ML-Modell-Feintuning.", "en": "Custom GPT/Claude/Gemini integrations, RAG systems, vector DBs and ML model fine-tuning for products.", "hi": "कस्टम GPT/Claude/Gemini इंटीग्रेशन, RAG सिस्टम, वेक्टर DB और प्रोडक्ट के लिए ML मॉडल फाइन-ट्यूनिंग।"}, "technologies": [{"name": "AI Chatbots (Customer Support"}, {"name": "Internal Tools)"}, {"name": "LLM Integration (OpenAI"}, {"name": "Gemini"}, {"name": "Claude)"}, {"name": "Prompt Engineering"}, {"name": "Predictive Analytics"}, {"name": "Retrieval-Augmented Generation (RAG) Systems"}, {"name": "Computer Vision Solutions"}, {"name": "Natural Language Processing (NLP)"}, {"name": "Vector Database Development"}, {"name": "Machine Learning Model Development"}, {"name": "AI Model Integration into Existing Products"}]}, "path": "/admin/services/69fafdf1be90555dc5fcc679", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb009be98c8a5737e82db0"}, "query": {}, "method": "PUT", "params": {"id": "69fafdf1be90555dc5fcc679"}, "durationMs": 140, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb0c2576b84ff3211c59f1	{"at": "2026-05-06T09:38:45.331Z", "ip": "10.30.232.8", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb0c2576b84ff3211c59f1", "body": {"items": [{"id": "how-we-hire", "url": "https://www.youtube.com/watch?v=N1s-GN1SWqY&amp;list=RDN1s-GN1SWqY&amp;start_radio=1", "title": "How QuickHire Works", "poster": "", "description": "A short walkthrough of the QuickHire booking flow."}]}, "path": "/admin/cms/videos", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb0c1976b84ff3211c59f0"}, "query": {}, "method": "PUT", "params": {"key": "videos"}, "durationMs": 132, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb1375e98c8a5737e82db8	{"at": "2026-05-06T10:09:57.592Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb1375e98c8a5737e82db8", "body": {"msg": "HELLO"}, "path": "/admin/bookings/69fb12ffe98c8a5737e82db5/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb12aee98c8a5737e82db3"}, "query": {}, "method": "POST", "params": {"id": "69fb12ffe98c8a5737e82db5"}, "durationMs": 67, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fb1383e98c8a5737e82dba	{"at": "2026-05-06T10:10:11.027Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb1383e98c8a5737e82dba", "body": {"pmId": "69faa5134e1d6b9cb1e2c751"}, "path": "/admin/bookings/69fb12ffe98c8a5737e82db5/assign-pm", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb12aee98c8a5737e82db3"}, "query": {}, "method": "POST", "params": {"id": "69fb12ffe98c8a5737e82db5"}, "durationMs": 73, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb1390e98c8a5737e82dbe	{"at": "2026-05-06T10:10:24.624Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb1390e98c8a5737e82dbe", "body": {"msg": "HELLO SIR"}, "path": "/admin/bookings/69fb12ffe98c8a5737e82db5/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb12aee98c8a5737e82db3"}, "query": {}, "method": "POST", "params": {"id": "69fb12ffe98c8a5737e82db5"}, "durationMs": 49, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fb13aae98c8a5737e82dc1	{"at": "2026-05-06T10:10:50.590Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb13aae98c8a5737e82dc1", "body": {"resourceId": "69faa5134e1d6b9cb1e2c754"}, "path": "/admin/bookings/69fb12ffe98c8a5737e82db5/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb12aee98c8a5737e82db3"}, "query": {}, "method": "POST", "params": {"id": "69fb12ffe98c8a5737e82db5"}, "durationMs": 95, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb27cbe98c8a5737e82dc6	{"at": "2026-05-06T11:36:43.599Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb27cbe98c8a5737e82dc6", "body": {}, "path": "/admin/bookings/69fb2756e98c8a5737e82dc4/confirm", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb27c1e98c8a5737e82dc5"}, "query": {}, "method": "POST", "params": {"id": "69fb2756e98c8a5737e82dc4"}, "durationMs": 62, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb27d2e98c8a5737e82dc7	{"at": "2026-05-06T11:36:50.211Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb27d2e98c8a5737e82dc7", "body": {"pmId": "69faa5134e1d6b9cb1e2c751"}, "path": "/admin/bookings/69fb2756e98c8a5737e82dc4/assign-pm", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb27c1e98c8a5737e82dc5"}, "query": {}, "method": "POST", "params": {"id": "69fb2756e98c8a5737e82dc4"}, "durationMs": 93, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb27ebe98c8a5737e82dcb	{"at": "2026-05-06T11:37:15.002Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb27ebe98c8a5737e82dcb", "body": {"resourceId": "69faa5134e1d6b9cb1e2c753"}, "path": "/admin/bookings/69fb2756e98c8a5737e82dc4/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb27c1e98c8a5737e82dc5"}, "query": {}, "method": "POST", "params": {}, "durationMs": 60, "statusCode": 409}	\N	\N	\N	\N	\N	\N	\N
69fb27f5e98c8a5737e82dcc	{"at": "2026-05-06T11:37:25.293Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb27f5e98c8a5737e82dcc", "body": {"resourceId": "69faa5134e1d6b9cb1e2c753"}, "path": "/admin/bookings/69fb2756e98c8a5737e82dc4/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb27c1e98c8a5737e82dc5"}, "query": {}, "method": "POST", "params": {}, "durationMs": 60, "statusCode": 409}	\N	\N	\N	\N	\N	\N	\N
69fb27f9e98c8a5737e82dcd	{"at": "2026-05-06T11:37:29.918Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb27f9e98c8a5737e82dcd", "body": {"resourceId": "69faa5134e1d6b9cb1e2c754"}, "path": "/admin/bookings/69fb2756e98c8a5737e82dc4/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb27c1e98c8a5737e82dc5"}, "query": {}, "method": "POST", "params": {}, "durationMs": 61, "statusCode": 409}	\N	\N	\N	\N	\N	\N	\N
69fb27fce98c8a5737e82dce	{"at": "2026-05-06T11:37:32.641Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb27fce98c8a5737e82dce", "body": {"resourceId": "69faa5134e1d6b9cb1e2c752"}, "path": "/admin/bookings/69fb2756e98c8a5737e82dc4/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb27c1e98c8a5737e82dc5"}, "query": {}, "method": "POST", "params": {"id": "69fb2756e98c8a5737e82dc4"}, "durationMs": 121, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb28dfe98c8a5737e82dde	{"at": "2026-05-06T11:41:19.560Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb28dfe98c8a5737e82dde", "body": {"country": "IN", "currency": "INR", "basePrice": 5999, "serviceId": "69fb01ae46a7a8a8c7b31783", "surgeRules": []}, "path": "/geo-pricing/admin", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb286ce98c8a5737e82ddd"}, "query": {}, "method": "POST", "params": {}, "durationMs": 145, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb28e5e98c8a5737e82ddf	{"at": "2026-05-06T11:41:25.350Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb28e5e98c8a5737e82ddf", "body": {"country": "AE", "currency": "AED", "basePrice": 334, "serviceId": "69fb01ae46a7a8a8c7b31783", "surgeRules": []}, "path": "/geo-pricing/admin", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb286ce98c8a5737e82ddd"}, "query": {}, "method": "POST", "params": {}, "durationMs": 128, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb2912e98c8a5737e82de1	{"at": "2026-05-06T11:42:10.770Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb2912e98c8a5737e82de1", "body": {"msg": "hello"}, "path": "/admin/tickets/69fae89c75ed7035320450d8/message", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb286ce98c8a5737e82ddd"}, "query": {}, "method": "POST", "params": {"id": "69fae89c75ed7035320450d8"}, "durationMs": 65, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fb2965e98c8a5737e82de5	{"at": "2026-05-06T11:43:33.604Z", "ip": "192.168.1.121", "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb2965e98c8a5737e82de5", "body": {"items": [{"id": "how-we-hire", "url": "https://www.youtube.com/watch?v=N1s-GN1SWqY", "urls": "https://www.youtube.com/watch?v=N1s-GN1SWqY", "title": "How QuickHire Works", "poster": "", "description": "Marketing explainer"}, {"id": "intro", "url": "https://www.youtube.com/watch?v=N1s-GN1SWqY", "urls": {"AE": "", "AU": "", "DE": "", "IN": "", "US": ""}, "title": "QuickHire Intro", "poster": "", "description": "Brand intro"}]}, "path": "/admin/cms/videos", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb286ce98c8a5737e82ddd"}, "query": {}, "method": "PUT", "params": {"key": "videos"}, "durationMs": 57, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb37a6e98c8a5737e82df4	{"at": "2026-05-06T12:44:22.546Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb37a6e98c8a5737e82df4", "body": {"reason": ""}, "path": "/admin/bookings/69fb3410e98c8a5737e82de8/reject", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "PATCH", "params": {"id": "69fb3410e98c8a5737e82de8"}, "durationMs": 61, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb37bfe98c8a5737e82df5	{"at": "2026-05-06T12:44:47.410Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb37bfe98c8a5737e82df5", "body": {"pmId": "69faa5134e1d6b9cb1e2c751"}, "path": "/admin/bookings/69fb3410e98c8a5737e82de8/assign-pm", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {"id": "69fb3410e98c8a5737e82de8"}, "durationMs": 87, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb37cee98c8a5737e82df8	{"at": "2026-05-06T12:45:02.725Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb37cee98c8a5737e82df8", "body": {"resourceId": "69faa5134e1d6b9cb1e2c752"}, "path": "/admin/bookings/69fb3410e98c8a5737e82de8/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {"id": "69fb3410e98c8a5737e82de8"}, "durationMs": 110, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb38e5e98c8a5737e82dfc	{"at": "2026-05-06T12:49:41.889Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb38e5e98c8a5737e82dfc", "body": {}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/confirm", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {"id": "69fb384be98c8a5737e82dfb"}, "durationMs": 63, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb3905e98c8a5737e82dfd	{"at": "2026-05-06T12:50:13.279Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb3905e98c8a5737e82dfd", "body": {"pmId": "69faa5134e1d6b9cb1e2c751"}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/assign-pm", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {"id": "69fb384be98c8a5737e82dfb"}, "durationMs": 84, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb3931e98c8a5737e82e02	{"at": "2026-05-06T12:50:57.400Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb3931e98c8a5737e82e02", "body": {"msg": "jdhs"}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {"id": "69fb384be98c8a5737e82dfb"}, "durationMs": 61, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fb3949e98c8a5737e82e07	{"at": "2026-05-06T12:51:21.415Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb3949e98c8a5737e82e07", "body": {"msg": "scdjhgv"}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {"id": "69fb384be98c8a5737e82dfb"}, "durationMs": 59, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fb3963e98c8a5737e82e0a	{"at": "2026-05-06T12:51:47.425Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb3963e98c8a5737e82e0a", "body": {"resourceId": "69faa5134e1d6b9cb1e2c752"}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {}, "durationMs": 49, "statusCode": 409}	\N	\N	\N	\N	\N	\N	\N
69fb3967e98c8a5737e82e0b	{"at": "2026-05-06T12:51:51.926Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb3967e98c8a5737e82e0b", "body": {"resourceId": "69faa5134e1d6b9cb1e2c753"}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {}, "durationMs": 49, "statusCode": 409}	\N	\N	\N	\N	\N	\N	\N
69fb396ae98c8a5737e82e0c	{"at": "2026-05-06T12:51:54.693Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb396ae98c8a5737e82e0c", "body": {"resourceId": "69faa5134e1d6b9cb1e2c754"}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {}, "durationMs": 50, "statusCode": 409}	\N	\N	\N	\N	\N	\N	\N
69fb3980e98c8a5737e82e0d	{"at": "2026-05-06T12:52:16.085Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb3980e98c8a5737e82e0d", "body": {"name": "skjshaxdciwuds", "email": "", "mobile": "wdasfsvb", "skills": []}, "path": "/admin/resources", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {}, "durationMs": 1, "statusCode": 422}	\N	\N	\N	\N	\N	\N	\N
69fb3985e98c8a5737e82e0f	{"at": "2026-05-06T12:52:21.794Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb3985e98c8a5737e82e0f", "body": {"name": "skjshaxdciwuds", "email": "", "mobile": "9876543567", "skills": [], "specialization": []}, "path": "/admin/resources", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {}, "durationMs": 54, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fb3993e98c8a5737e82e10	{"at": "2026-05-06T12:52:34.946Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb3993e98c8a5737e82e10", "body": {"resourceId": "69fb3985e98c8a5737e82e0e"}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/assign-resource", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {"id": "69fb384be98c8a5737e82dfb"}, "durationMs": 98, "statusCode": 200}	\N	\N	\N	\N	\N	\N	\N
69fb39b6e98c8a5737e82e13	{"at": "2026-05-06T12:53:10.284Z", "ip": "192.168.1.197", "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36", "_id": "69fb39b6e98c8a5737e82e13", "body": {"msg": "sakhjgxshagjk"}, "path": "/admin/bookings/69fb384be98c8a5737e82dfb/messages", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "admin", "sessionId": "69fb3740e98c8a5737e82df3"}, "query": {}, "method": "POST", "params": {"id": "69fb384be98c8a5737e82dfb"}, "durationMs": 57, "statusCode": 201}	\N	\N	\N	\N	\N	\N	\N
69fb55efed817c143dc9bf4f	{"at": "2026-05-06T14:53:35.839Z", "ip": "10.27.254.3", "ua": "curl/8.7.1", "_id": "69fb55efed817c143dc9bf4f", "body": {"name": "UK Operations Lead", "email": "uk-admin@quickhire.services", "mobile": "9000000060", "country": "AU"}, "path": "/api/admin/country-admins", "actor": {"id": "69faa5134e1d6b9cb1e2c750", "role": "super_admin", "sessionId": "69fb55efed817c143dc9bf4e"}, "query": {}, "method": "POST", "params": {}, "durationMs": 132, "statusCode": 409}	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_posts (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69fb2936e98c8a5737e82de3	{"_id": "69fb2936e98c8a5737e82de3", "seo": {"ar": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "de": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "en": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "es": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "fr": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "hi": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}}, "body": {"ar": "", "de": "", "en": "", "es": "", "fr": "", "hi": "", "ja": "", "zh-CN": ""}, "slug": "ewrwerr", "tags": [], "title": {"ar": "", "de": "", "en": "rtwer", "es": "", "fr": "", "hi": "", "ja": "", "zh-CN": ""}, "status": "published", "excerpt": {"ar": "", "de": "", "en": "weqr", "es": "", "fr": "", "hi": "", "ja": "", "zh-CN": ""}, "featured": false, "authorBio": {"ar": "", "de": "", "en": "", "es": "", "fr": "", "hi": "", "ja": "", "zh-CN": ""}, "createdAt": "2026-05-06T11:42:46.827Z", "createdBy": "69faa5134e1d6b9cb1e2c750", "updatedAt": "2026-05-06T11:42:46.827Z", "viewCount": 0, "authorName": "QuickHire Team", "categories": [], "coverImage": "", "publishedAt": "2026-05-06T11:42:46.827Z", "scheduledAt": null, "authorAvatar": "", "readingTimeMinutes": 1, "coverImageByCountry": {}}	\N	published	\N	\N	\N	2026-05-06 17:12:46.827+05:30	2026-05-06 17:12:46.827+05:30
69fb2951e98c8a5737e82de4	{"_id": "69fb2951e98c8a5737e82de4", "seo": {"ar": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "de": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "en": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "es": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "fr": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}, "hi": {"ogImage": "", "ogTitle": "", "keywords": [], "metaTitle": "", "canonicalUrl": "", "ogDescription": "", "metaDescription": ""}}, "body": {"ar": "", "de": "", "en": "<p>sfasdf</p>", "es": "", "fr": "", "hi": "", "ja": "", "zh-CN": ""}, "slug": "s", "tags": [], "title": {"ar": "", "de": "", "en": "sadfdfasfasf", "es": "", "fr": "", "hi": "", "ja": "", "zh-CN": ""}, "status": "published", "excerpt": {"ar": "", "de": "", "en": "asdff", "es": "", "fr": "", "hi": "", "ja": "", "zh-CN": ""}, "featured": false, "authorBio": {"ar": "", "de": "", "en": "", "es": "", "fr": "", "hi": "", "ja": "", "zh-CN": ""}, "createdAt": "2026-05-06T11:43:13.121Z", "createdBy": "69faa5134e1d6b9cb1e2c750", "updatedAt": "2026-05-06T11:43:13.121Z", "viewCount": 0, "authorName": "QuickHire Team", "categories": [], "coverImage": "", "publishedAt": "2026-05-06T11:43:13.121Z", "scheduledAt": null, "authorAvatar": "", "readingTimeMinutes": 1, "coverImageByCountry": {}}	\N	published	\N	\N	\N	2026-05-06 17:13:13.121+05:30	2026-05-06 17:13:13.121+05:30
\.


--
-- Data for Name: booking_histories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_histories (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa51424729f95617814de	{"_id": "69faa51424729f95617814de", "pmId": "69faa5134e1d6b9cb1e2c751", "hours": 8, "status": "completed", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "endTime": "2026-04-27T02:19:00.673Z", "pricing": {"tax": 1152, "hours": 8, "total": 7552, "currency": "INR", "subtotal": 6400, "hourlyRate": 800}, "createdAt": "2026-04-24T02:19:00.673Z", "serviceId": null, "startTime": "2026-04-26T02:19:00.673Z", "updatedAt": "2026-05-06T14:08:43.573Z", "resourceId": "69faa5134e1d6b9cb1e2c752", "requirements": "Build a dashboard with React and Recharts, integrate REST APIs."}	IN	completed	69faa5134e1d6b9cb1e2c755	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c752	2026-04-24 07:49:00.673+05:30	2026-05-06 19:38:43.573+05:30
69faa51424729f95617814df	{"_id": "69faa51424729f95617814df", "pmId": "69faa5134e1d6b9cb1e2c751", "hours": 16, "status": "ongoing", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "endTime": "2026-05-11T02:19:00.794Z", "pricing": {"tax": 2016, "hours": 16, "total": 13216, "currency": "INR", "subtotal": 11200, "hourlyRate": 700}, "createdAt": "2026-05-03T02:19:00.794Z", "serviceId": null, "startTime": "2026-05-04T02:19:00.794Z", "updatedAt": "2026-05-06T14:08:43.698Z", "resourceId": "69faa5134e1d6b9cb1e2c753", "requirements": "Add push notifications and offline mode to existing Flutter app."}	IN	ongoing	69faa5134e1d6b9cb1e2c755	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c753	2026-05-03 07:49:00.794+05:30	2026-05-06 19:38:43.698+05:30
69faa51424729f95617814e0	{"_id": "69faa51424729f95617814e0", "pmId": "69faa5134e1d6b9cb1e2c751", "hours": 4, "status": "pending", "userId": "69faa5134e1d6b9cb1e2c756", "country": "IN", "pricing": {"tax": 720, "hours": 4, "total": 4720, "currency": "INR", "subtotal": 4000, "hourlyRate": 1000}, "createdAt": "2026-05-05T02:19:00.822Z", "serviceId": null, "startTime": "2026-05-07T02:19:00.822Z", "updatedAt": "2026-05-06T14:08:43.812Z", "resourceId": "69faa5134e1d6b9cb1e2c754", "requirements": "Set up GitHub Actions CI/CD pipeline with Docker and deploy to AWS ECS."}	IN	pending	69faa5134e1d6b9cb1e2c756	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c754	2026-05-05 07:49:00.822+05:30	2026-05-06 19:38:43.812+05:30
69fae89975ed7035320450d0	{"_id": "69fae89975ed7035320450d0", "pmId": "69faa5134e1d6b9cb1e2c751", "hours": 8, "status": "completed", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "endTime": "2026-04-27T07:07:05.746Z", "pricing": {"tax": 1152, "hours": 8, "total": 7552, "currency": "INR", "subtotal": 6400, "hourlyRate": 800}, "createdAt": "2026-04-24T07:07:05.746Z", "serviceId": null, "startTime": "2026-04-26T07:07:05.746Z", "updatedAt": "2026-05-06T14:08:43.417Z", "resourceId": "69faa5134e1d6b9cb1e2c752", "requirements": "Build a dashboard with React and Recharts, integrate REST APIs."}	IN	completed	69faa5134e1d6b9cb1e2c755	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c752	2026-04-24 12:37:05.746+05:30	2026-05-06 19:38:43.417+05:30
69fae89975ed7035320450d1	{"_id": "69fae89975ed7035320450d1", "pmId": "69faa5134e1d6b9cb1e2c751", "hours": 16, "status": "ongoing", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "endTime": "2026-05-11T07:07:05.806Z", "pricing": {"tax": 2016, "hours": 16, "total": 13216, "currency": "INR", "subtotal": 11200, "hourlyRate": 700}, "createdAt": "2026-05-03T07:07:05.806Z", "serviceId": null, "startTime": "2026-05-04T07:07:05.806Z", "updatedAt": "2026-05-06T14:08:43.638Z", "resourceId": "69faa5134e1d6b9cb1e2c753", "requirements": "Add push notifications and offline mode to existing Flutter app."}	IN	ongoing	69faa5134e1d6b9cb1e2c755	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c753	2026-05-03 12:37:05.806+05:30	2026-05-06 19:38:43.638+05:30
69fae89975ed7035320450d2	{"_id": "69fae89975ed7035320450d2", "pmId": "69faa5134e1d6b9cb1e2c751", "hours": 4, "status": "pending", "userId": "69faa5134e1d6b9cb1e2c756", "country": "IN", "pricing": {"tax": 720, "hours": 4, "total": 4720, "currency": "INR", "subtotal": 4000, "hourlyRate": 1000}, "createdAt": "2026-05-05T07:07:05.861Z", "serviceId": null, "startTime": "2026-05-07T07:07:05.861Z", "updatedAt": "2026-05-06T14:08:43.753Z", "resourceId": "69faa5134e1d6b9cb1e2c754", "requirements": "Set up GitHub Actions CI/CD pipeline with Docker and deploy to AWS ECS."}	IN	pending	69faa5134e1d6b9cb1e2c756	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c754	2026-05-05 12:37:05.861+05:30	2026-05-06 19:38:43.753+05:30
\.


--
-- Data for Name: chat; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69fadacce8408cd6d70ee6b6	{"_id": "69fadacce8408cd6d70ee6b6", "msg": "Hello", "roomId": "booking_69fada78e8408cd6d70ee6b0", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69fada78e8408cd6d70ee6b0", "createdAt": "2026-05-06T06:08:12.202Z", "serviceId": "69faa5144e1d6b9cb1e2c761", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 11:38:12.202+05:30	\N
69fadaede8408cd6d70ee6ba	{"_id": "69fadaede8408cd6d70ee6ba", "msg": "hello", "roomId": "booking_69fada78e8408cd6d70ee6b0", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69fada78e8408cd6d70ee6b0", "createdAt": "2026-05-06T06:08:45.867Z", "serviceId": "69faa5144e1d6b9cb1e2c761", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 11:38:45.867+05:30	\N
69faec4ce98c8a5737e82da1	{"_id": "69faec4ce98c8a5737e82da1", "msg": "hello", "roomId": "booking_69faebe0e98c8a5737e82d9c", "seenBy": [], "msgType": 0, "firstMsg": 0, "senderId": "69faebd14e1d6b9cb1e2c82d", "bookingId": "69faebe0e98c8a5737e82d9c", "createdAt": "2026-05-06T07:22:52.353Z", "serviceId": "69fae8984e1d6b9cb1e2c80e", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 12:52:52.353+05:30	\N
69faec54e98c8a5737e82da2	{"_id": "69faec54e98c8a5737e82da2", "msg": "hy", "roomId": "booking_69faebe0e98c8a5737e82d9c", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69faebe0e98c8a5737e82d9c", "createdAt": "2026-05-06T07:23:00.760Z", "serviceId": "69fae8984e1d6b9cb1e2c80e", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 12:53:00.76+05:30	\N
69faec5fe98c8a5737e82da6	{"_id": "69faec5fe98c8a5737e82da6", "msg": "hello", "roomId": "booking_69faebe0e98c8a5737e82d9c", "seenBy": [], "msgType": 0, "firstMsg": 0, "senderId": "69faebd14e1d6b9cb1e2c82d", "bookingId": "69faebe0e98c8a5737e82d9c", "createdAt": "2026-05-06T07:23:11.863Z", "serviceId": "69fae8984e1d6b9cb1e2c80e", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 12:53:11.863+05:30	\N
69faec62e98c8a5737e82da7	{"_id": "69faec62e98c8a5737e82da7", "msg": "fagklfd", "roomId": "booking_69faebe0e98c8a5737e82d9c", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69faebe0e98c8a5737e82d9c", "createdAt": "2026-05-06T07:23:14.321Z", "serviceId": "69fae8984e1d6b9cb1e2c80e", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 12:53:14.321+05:30	\N
69faec6ee98c8a5737e82dab	{"_id": "69faec6ee98c8a5737e82dab", "msg": "dfasf", "roomId": "booking_69faebe0e98c8a5737e82d9c", "seenBy": [], "msgType": 0, "firstMsg": 0, "senderId": "69faebd14e1d6b9cb1e2c82d", "bookingId": "69faebe0e98c8a5737e82d9c", "createdAt": "2026-05-06T07:23:26.482Z", "serviceId": "69fae8984e1d6b9cb1e2c80e", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 12:53:26.482+05:30	\N
69fb1351e98c8a5737e82db6	{"_id": "69fb1351e98c8a5737e82db6", "msg": "hi sir", "roomId": "booking_69fb12ffe98c8a5737e82db5", "seenBy": [], "msgType": 0, "firstMsg": 1, "senderId": "69fb12f84e1d6b9cb1e2c8e6", "bookingId": "69fb12ffe98c8a5737e82db5", "createdAt": "2026-05-06T10:09:21.268Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 15:39:21.268+05:30	\N
69fb1375e98c8a5737e82db7	{"_id": "69fb1375e98c8a5737e82db7", "msg": "HELLO", "roomId": "booking_69fb12ffe98c8a5737e82db5", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69fb12ffe98c8a5737e82db5", "createdAt": "2026-05-06T10:09:57.633Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 15:39:57.633+05:30	\N
69fb1390e98c8a5737e82dbd	{"_id": "69fb1390e98c8a5737e82dbd", "msg": "HELLO SIR", "roomId": "booking_69fb12ffe98c8a5737e82db5", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69fb12ffe98c8a5737e82db5", "createdAt": "2026-05-06T10:10:24.647Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 15:40:24.647+05:30	\N
69fb27e3e98c8a5737e82dca	{"_id": "69fb27e3e98c8a5737e82dca", "msg": "hekki", "roomId": "booking_69fb2756e98c8a5737e82dc4", "seenBy": [], "msgType": 0, "firstMsg": 0, "senderId": "69faa5134e1d6b9cb1e2c756", "bookingId": "69fb2756e98c8a5737e82dc4", "createdAt": "2026-05-06T11:37:07.001Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 17:07:07.001+05:30	\N
69fb2823e98c8a5737e82dd7	{"_id": "69fb2823e98c8a5737e82dd7", "msg": "hello", "roomId": "booking_69fb2756e98c8a5737e82dc4", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c751", "bookingId": "69fb2756e98c8a5737e82dc4", "createdAt": "2026-05-06T11:38:11.970Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderName": "PM", "senderRole": "pm"}	\N	\N	\N	\N	\N	2026-05-06 17:08:11.97+05:30	\N
69fb2828e98c8a5737e82dda	{"_id": "69fb2828e98c8a5737e82dda", "msg": "hekki", "roomId": "booking_69fb2756e98c8a5737e82dc4", "seenBy": [], "msgType": 0, "firstMsg": 0, "senderId": "69faa5134e1d6b9cb1e2c756", "bookingId": "69fb2756e98c8a5737e82dc4", "createdAt": "2026-05-06T11:38:16.605Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 17:08:16.605+05:30	\N
69fb3923e98c8a5737e82e00	{"_id": "69fb3923e98c8a5737e82e00", "msg": "wskhjdsb", "roomId": "booking_69fb384be98c8a5737e82dfb", "seenBy": [], "msgType": 0, "firstMsg": 0, "senderId": "69fb33f44e1d6b9cb1e2c930", "bookingId": "69fb384be98c8a5737e82dfb", "createdAt": "2026-05-06T12:50:43.872Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 18:20:43.872+05:30	\N
69fb3931e98c8a5737e82e01	{"_id": "69fb3931e98c8a5737e82e01", "msg": "jdhs", "roomId": "booking_69fb384be98c8a5737e82dfb", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69fb384be98c8a5737e82dfb", "createdAt": "2026-05-06T12:50:57.431Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 18:20:57.431+05:30	\N
69fb393ce98c8a5737e82e05	{"_id": "69fb393ce98c8a5737e82e05", "msg": "mhgdsa", "roomId": "booking_69fb384be98c8a5737e82dfb", "seenBy": [], "msgType": 0, "firstMsg": 0, "senderId": "69fb33f44e1d6b9cb1e2c930", "bookingId": "69fb384be98c8a5737e82dfb", "createdAt": "2026-05-06T12:51:08.818Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 18:21:08.818+05:30	\N
69fb3949e98c8a5737e82e06	{"_id": "69fb3949e98c8a5737e82e06", "msg": "scdjhgv", "roomId": "booking_69fb384be98c8a5737e82dfb", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69fb384be98c8a5737e82dfb", "createdAt": "2026-05-06T12:51:21.444Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 18:21:21.444+05:30	\N
69fb39b6e98c8a5737e82e12	{"_id": "69fb39b6e98c8a5737e82e12", "msg": "sakhjgxshagjk", "roomId": "booking_69fb384be98c8a5737e82dfb", "msgType": 0, "senderId": "69faa5134e1d6b9cb1e2c750", "bookingId": "69fb384be98c8a5737e82dfb", "createdAt": "2026-05-06T12:53:10.311Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderName": "Admin", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 18:23:10.311+05:30	\N
69fb39bde98c8a5737e82e17	{"_id": "69fb39bde98c8a5737e82e17", "msg": "skjhjsvhkdjcx", "roomId": "booking_69fb384be98c8a5737e82dfb", "seenBy": [], "msgType": 0, "firstMsg": 0, "senderId": "69fb33f44e1d6b9cb1e2c930", "bookingId": "69fb384be98c8a5737e82dfb", "createdAt": "2026-05-06T12:53:17.540Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "attachment": null, "senderRole": "user", "deliveredTo": []}	\N	\N	\N	\N	\N	2026-05-06 18:23:17.54+05:30	\N
\.


--
-- Data for Name: chatbot_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chatbot_logs (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cms_articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cms_articles (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cms_banners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cms_banners (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa3b64e1d6b9cb1e2c74e	{"_id": "69faa3b64e1d6b9cb1e2c74e", "body": {"ar": "أخبرنا بما تحاول بناءه أو إصلاحه، وسنقوم بمطابقتك مع الخبير المناسب.", "de": "Sagen Sie uns, was Sie bauen oder reparieren möchten — wir vermitteln den passenden Experten.", "en": "Tell us what you're trying to build or fix, and we'll match you with the right expert.", "es": "Cuéntanos qué estás tratando de construir o arreglar y te conectaremos con el experto adecuado.", "hi": "हमें बताएं कि आप क्या बनाना या ठीक करना चाहते हैं, और हम आपको सही विशेषज्ञ से मिलाएंगे।"}, "order": 0, "title": {"ar": "غير متأكد ما\\nتحتاج؟", "de": "Nicht sicher, was\\nSie brauchen?", "en": "Not sure what\\nyou need?", "es": "¿No sabes qué\\nnecesitas?", "hi": "पता नहीं क्या\\nचाहिए?"}, "active": true, "ctaUrl": "/book-your-resource", "variant": "simple", "ctaLabel": {"ar": "ابحث عن خبير", "de": "Experten finden", "en": "Find Right Experts", "es": "Encontrar experto", "hi": "सही विशेषज्ञ ढूंढें"}, "mediaUrl": "/images/resource-services/bookexpert.png", "position": "featured-find-experts", "createdAt": "2026-05-06T02:13:10.028Z", "mediaType": "image", "updatedAt": "2026-05-06T12:44:06.511Z", "internalName": "Featured — Find Right Experts"}	\N	\N	\N	\N	\N	2026-05-06 07:43:10.028+05:30	2026-05-06 18:14:06.511+05:30
\.


--
-- Data for Name: cms_content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cms_content (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5164e1d6b9cb1e2c78d	{"_id": "69faa5164e1d6b9cb1e2c78d", "key": "hero", "data": {"headline": "Hire IT Experts Instantly.", "cta_primary": "Hire Now", "subheadline": "No Delays. No Hassle.", "cta_secondary": "How it works"}, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c78e	{"_id": "69faa5164e1d6b9cb1e2c78e", "key": "about_us", "data": {"body": "QuickHire is an AI-powered platform that connects companies with vetted, full-time IT professionals — developers, designers, QA, DevOps and more — without the delays of traditional hiring.", "title": "We match businesses with top IT talent in under 10 minutes.", "founded": 2023, "team_size": "50+"}, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c78f	{"_id": "69faa5164e1d6b9cb1e2c78f", "key": "contact", "data": {"email": "hello@quickhire.services", "phone": "+91-9000000000", "address": "Bangalore, Karnataka, India", "linkedin": "https://linkedin.com/company/quickhire"}, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c790	{"_id": "69faa5164e1d6b9cb1e2c790", "key": "footer", "data": {"tagline": "Your tech team, ready in minutes.", "copyright": "© 2026 QuickHire Services Pvt. Ltd."}, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa536dbc2ae557657dfb5	{"_id": "69faa536dbc2ae557657dfb5", "key": "technologies", "items": [{"img": "/images/techimages/jenkin.png", "name": "Jenkins"}, {"img": "/images/techimages/node.png", "name": "Node.Js"}, {"img": "/images/techimages/react.png", "name": "React"}, {"img": "/images/techimages/kotlin.png", "name": "Kotlin"}, {"img": "/images/techimages/flutter.png", "name": "Flutter"}, {"img": "/images/techimages/docker.png", "name": "Docker"}, {"img": "/images/techimages/magento.png", "name": "Magento"}, {"img": "/images/techimages/aws.png", "name": "AWS"}, {"img": "/images/techimages/figma.png", "name": "Figma"}, {"img": "/images/techimages/wordpress.png", "name": "Wordpress"}, {"img": "/images/techimages/html.png", "name": "HTML"}], "updatedAt": "2026-05-06T02:19:34.772Z"}	\N	\N	\N	\N	\N	\N	2026-05-06 07:49:34.772+05:30
69faa536dbc2ae557657dfb6	{"_id": "69faa536dbc2ae557657dfb6", "key": "testimonials", "items": [{"logo": "/images/client/ecom.svg", "role": "Senior Engineering Director", "company": "E-Commerce Platform", "description": "A leading automotive brand that scaled its engineering and digital product teams using QuickHire's full-time tech and design experts to accelerate internal platforms and customer-facing initiatives without long hiring cycles."}, {"logo": "/images/client/gale.svg", "role": "Partner & Managing Director", "company": "Gale Technologies", "description": "A global consulting firm that leveraged QuickHire Experts to rapidly onboard experienced designers and engineers for high-priority client engagements, ensuring speed, quality, and delivery under tight timelines."}, {"logo": "/images/client/kfintech.svg", "role": "VP of Digital Transformation", "company": "KFintech Solutions", "description": "A large enterprise that used QuickHire to bridge critical tech and UX skill gaps across digital transformation projects, enabling faster execution while maintaining enterprise-grade quality standards."}, {"logo": "/images/client/navatar.svg", "role": "Head of Digital Operations", "company": "Navatar Digital", "description": "A consumer brand that partnered with QuickHire to strengthen its e-commerce, ERP, and digital experience teams, scaling full-time professionals during peak business and expansion phases."}, {"logo": "/images/client/ninjacart.svg", "role": "Chief Information Officer", "company": "NinjaCart", "description": "A fast-growing retail brand that onboarded dedicated tech and design professionals via QuickHire to support omnichannel growth, internal tools, and performance-driven digital initiatives."}], "updatedAt": "2026-05-06T02:19:34.952Z"}	\N	\N	\N	\N	\N	\N	2026-05-06 07:49:34.952+05:30
69faa536dbc2ae557657dfb7	{"_id": "69faa536dbc2ae557657dfb7", "key": "features", "items": [{"icon": "/images/homepage/No Freelancers.svg", "title": "No Freelancers", "description": "You work with only vetted, experienced tech professionals you can rely on."}, {"icon": "/images/homepage/Full-time Employees.svg", "title": "Full-Time Employees Working On Your Project", "description": "Every expert works inside QuickHire."}, {"icon": "/images/homepage/Expertise in 10 Minutes.svg", "title": "Expertise In 10 Minutes", "description": "Get matched with the right developer, designer, QA, or tech specialist in under 10 minutes for urgent fixes and fast execution."}, {"icon": "/images/homepage/Managed Delivery.svg", "title": "Managed delivery by Technical Project Manager", "description": "Get task-based support, hourly help, 4-hour or 8-hour sessions, and easily ramp up or ramp down talent across skills whenever your needs change."}, {"icon": "/images/homepage/Flexible Working Model.svg", "title": "Flexible working model", "description": "Get task-based support, hourly help, 4-hour or 8-hour sessions, and easily ramp up or ramp down talent across skills whenever your needs change."}, {"icon": "/images/homepage/aiempowered.svg", "title": "AI-empowered resources", "description": "Every expert comes equipped with AI-powered workflows for faster, smarter problem-solving."}], "updatedAt": "2026-05-06T02:19:34.969Z"}	\N	\N	\N	\N	\N	\N	2026-05-06 07:49:34.969+05:30
69fb070082cd1383c36c1bd9	{"_id": "69fb070082cd1383c36c1bd9", "key": "videos", "items": [{"id": "how-we-hire", "url": "https://www.youtube.com/watch?v=N1s-GN1SWqY", "urls": "https://www.youtube.com/watch?v=N1s-GN1SWqY", "title": "How QuickHire Works", "poster": "", "description": "Marketing explainer"}, {"id": "intro", "url": "https://www.youtube.com/watch?v=N1s-GN1SWqY", "urls": {"AE": "", "AU": "", "DE": "", "IN": "", "US": ""}, "title": "QuickHire Intro", "poster": "", "description": "Brand intro"}], "updatedAt": "2026-05-06T11:43:33.604Z"}	\N	\N	\N	\N	\N	\N	2026-05-06 17:13:33.604+05:30
69fb77fce98c8a5737e82e19	{"_id": "69fb77fce98c8a5737e82e19", "key": "faqs", "items": [{"id": "general", "name": "General Information", "items": [{"id": "q1", "answer": "Once you place your request and complete the payment, system begins allocation instantly. Within 10 minutes, your TPM connects with you, confirms the requirement, and assigns the right expert. It removes traditional hiring wait times that typically take days or weeks.", "question": "What does \\"Available in 10\\" actually mean?"}, {"id": "q2", "answer": "You select the skill you need, choose the number of hours, and complete the payment. The Ai-TPM system immediately starts matching your requirement. This triggers a fast allocation cycle where your TPM validates the need, checks availability, and assigns an expert — all within minutes.", "question": "How does the instant booking process work?"}, {"id": "q3", "answer": "The TPM provides short-term support by validating your need, checking skill fit, and assigning the right resource quickly.", "question": "What is the role of TPM in the allocation process?"}, {"id": "q4", "answer": "Yes. The platform supports almost all major IT categories — Development (Frontend, Backend, Mobile), Design, QA, DevOps, Ai Engineering, Cloud, Content, Digital Marketing, and more. New domains keep getting added based on customer needs.", "question": "Do we provide resources from all IT domains?"}]}, {"id": "purchasing", "name": "Purchasing & Payment", "items": [{"id": "q5", "answer": "Yes. You can book for as little as four hour or extend your booking to several days based on your project. The system is flexible and supports short tasks, urgent fixes, or continuous work.", "question": "Can customers book resources for hours or days?"}, {"id": "q6", "answer": "Absolutely. If you need more hours or want to continue the work, you can extend the booking instantly from the app. The system prioritizes your active resource to maintain continuity.", "question": "Can customers extend their booking anytime?"}]}, {"id": "plan", "name": "Plan & Pricing", "items": [{"id": "q7", "answer": "A captive resource works only on your project during the booked hours. They are not shared between clients and do not multitask across multiple assignments. You get undivided focus and dedicated output during your session.", "question": "What does \\"Captive Resource\\" mean?"}]}, {"id": "setup", "name": "Setup & Configuration", "items": []}, {"id": "call", "name": "Call management & Features", "items": [{"id": "q8", "answer": "The app supports Live Chat, in-app messaging, email updates, and external communication tools like Teams or Zoom for meetings. Everything is built to keep your work moving without unnecessary delays.", "question": "What tools are integrated inside platform?"}, {"id": "q9", "answer": "Once your booking is active, live chat gets activated automatically. You can chat with the TPM and the assigned resource directly, share files, clarify tasks, and track progress — all inside the app. For calls, the TPM schedules meetings based on need.", "question": "How do customers communicate with the resource or TPM?"}]}, {"id": "integration", "name": "Integration & Compatibility", "items": []}, {"id": "security", "name": "Security & Privacy", "items": []}, {"id": "support", "name": "Customer Support & Resource", "items": [{"id": "q10", "answer": "All experts on the platform are pre-vetted, experienced, and trained to work in high-speed, outcome-driven environments. They come from strong IT backgrounds with proven domain knowledge across development, design, Ai, DevOps, QA, content, and more.", "question": "What level of experience and skill do resources have?"}, {"id": "q11", "answer": "Yes. Once assigned to your session, they work solely on your task. This ensures focus, consistent output, and no dilution of effort.", "question": "Are resources exclusive to one project at a time?"}]}], "updatedAt": "2026-05-06T17:18:52.239Z"}	\N	\N	\N	\N	\N	\N	2026-05-06 22:48:52.239+05:30
69fb7802e98c8a5737e82e1b	{"_id": "69fb7802e98c8a5737e82e1b", "key": "segments", "items": [{"icon": "/images/about/who_we_serve4.png", "title": "Startups", "description": "Ship faster without committing to full-time hires."}, {"icon": "/images/about/who_we_serve3.png", "title": "Product Companies", "description": "Clear sprint backlogs with developers who contribute immediately."}, {"icon": "/images/about/who_we_serve2.png", "title": "Mid-Size Businesses", "description": "Scale technical capacity as priorities shift."}, {"icon": "/images/about/who_we_serve1.png", "title": "Enterprises", "description": "Access niche expertise without lengthy hiring cycles."}], "updatedAt": "2026-05-06T17:18:58.410Z"}	\N	\N	\N	\N	\N	\N	2026-05-06 22:48:58.41+05:30
69fb7802e98c8a5737e82e1a	{"_id": "69fb7802e98c8a5737e82e1a", "key": "process_steps", "items": [{"title": "Booking", "number": 1, "description": "Choose your resource and place a booking in minutes."}, {"title": "Kick-off Call", "number": 2, "description": "Connect with onboarded and your project manager to align on scope and execution."}, {"title": "Work Starts", "number": 3, "description": "The expert begins work based on agreed plan."}, {"title": "Get updates", "number": 4, "description": "Receive regular progress updates via chat or email from your project manager."}, {"title": "Extend or close", "number": 5, "description": "Add more hours, continue with the same expert, or close project when done."}], "updatedAt": "2026-05-06T17:18:58.409Z"}	\N	\N	\N	\N	\N	\N	2026-05-06 22:48:58.409+05:30
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.countries (_id, code, name, currency, supported_langs, config, active, created_at, updated_at) FROM stdin;
69faa3b54e1d6b9cb1e2c744	IN	{"en": "India"}	INR	["en", "hi"]	\N	t	2026-05-07 03:04:17.112+05:30	2026-05-07 03:04:16.9+05:30
69faa3b54e1d6b9cb1e2c745	AE	{"en": "United Arab Emirates"}	AED	["ar", "en"]	\N	t	2026-05-07 03:04:17.125+05:30	2026-05-07 03:04:16.9+05:30
69faa3b54e1d6b9cb1e2c746	DE	{"en": "Germany"}	EUR	["de", "en"]	\N	t	2026-05-07 03:04:17.127+05:30	2026-05-07 03:04:16.9+05:30
69faa3b54e1d6b9cb1e2c749	GB	{"en": "United Kingdom"}	GBP	["en"]	\N	f	2026-05-07 03:04:17.128+05:30	2026-05-07 03:04:16.9+05:30
69faa3b54e1d6b9cb1e2c748	AU	{"en": "Australia"}	AUD	["en"]	\N	t	2026-05-07 03:04:17.129+05:30	2026-05-07 03:04:16.9+05:30
69faa3b54e1d6b9cb1e2c747	US	{"en": "United States"}	USD	["en"]	\N	t	2026-05-07 03:04:17.13+05:30	2026-05-07 03:04:16.9+05:30
69faa3b54e1d6b9cb1e2c74b	SG	{"en": "Singapore"}	SGD	["en"]	\N	f	2026-05-07 03:04:17.131+05:30	2026-05-07 03:04:16.9+05:30
69faa3b54e1d6b9cb1e2c74a	SA	{"en": "Saudi Arabia"}	SAR	["ar", "en"]	\N	f	2026-05-07 03:04:17.132+05:30	2026-05-07 03:04:16.9+05:30
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currencies (_id, code, name, symbol, decimals, active, created_at, updated_at) FROM stdin;
69faa5164e1d6b9cb1e2c791	INR	Indian Rupee	₹	2	t	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c792	USD	US Dollar	$	2	t	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c793	AED	UAE Dirham	د.إ	2	t	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
\.


--
-- Data for Name: fcm_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fcm_tokens (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_flags (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5154e1d6b9cb1e2c778	{"_id": "69faa5154e1d6b9cb1e2c778", "key": "chat_enabled", "enabled": true, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "updatedBy": "69faa5134e1d6b9cb1e2c750", "rolloutPct": 100, "description": "In-app chat between user, PM and resource"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c779	{"_id": "69faa5154e1d6b9cb1e2c779", "key": "ai_matching", "enabled": true, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "updatedBy": "69faa5134e1d6b9cb1e2c750", "rolloutPct": 100, "description": "AI-powered resource matching at booking time"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c77a	{"_id": "69faa5154e1d6b9cb1e2c77a", "key": "promo_codes", "enabled": true, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "updatedBy": "69faa5134e1d6b9cb1e2c750", "rolloutPct": 100, "description": "Promo code redemption at checkout"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c77b	{"_id": "69faa5154e1d6b9cb1e2c77b", "key": "razorpay_payments", "enabled": true, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "updatedBy": "69faa5134e1d6b9cb1e2c750", "rolloutPct": 100, "description": "Razorpay payment gateway"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c77c	{"_id": "69faa5154e1d6b9cb1e2c77c", "key": "referral_program", "enabled": true, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "updatedBy": "69faa5134e1d6b9cb1e2c750", "rolloutPct": 100, "description": "User referral & commission program"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c77d	{"_id": "69faa5154e1d6b9cb1e2c77d", "key": "resource_deliverables", "enabled": true, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "updatedBy": "69faa5134e1d6b9cb1e2c750", "rolloutPct": 100, "description": "Resource can upload deliverables per job"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c77e	{"_id": "69faa5154e1d6b9cb1e2c77e", "key": "dark_mode", "enabled": false, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "updatedBy": "69faa5134e1d6b9cb1e2c750", "rolloutPct": 0, "description": "Dark mode UI toggle"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c77f	{"_id": "69faa5154e1d6b9cb1e2c77f", "key": "new_dashboard", "enabled": true, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "updatedBy": "69faa5134e1d6b9cb1e2c750", "rolloutPct": 50, "description": "New analytics dashboard (50% rollout)"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
\.


--
-- Data for Name: fx_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fx_rates (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: geo_pricing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.geo_pricing (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5164e1d6b9cb1e2c794	{"_id": "69faa5164e1d6b9cb1e2c794", "tiers": {"max": 1200, "min": 450, "default": 800}, "country": "IN", "currency": "INR", "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "multiplier": 1}	IN	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c795	{"_id": "69faa5164e1d6b9cb1e2c795", "tiers": {"max": 25, "min": 10, "default": 15}, "country": "US", "currency": "USD", "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "multiplier": 0.012}	US	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c796	{"_id": "69faa5164e1d6b9cb1e2c796", "tiers": {"max": 90, "min": 35, "default": 55}, "country": "AE", "currency": "AED", "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "multiplier": 0.044}	AE	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69fb28df4e1d6b9cb1e2c90e	{"_id": "69fb28df4e1d6b9cb1e2c90e", "country": "IN", "currency": "INR", "basePrice": 5999, "createdAt": "2026-05-06T11:41:19.560Z", "serviceId": "69fb01ae46a7a8a8c7b31783", "updatedAt": "2026-05-06T11:41:19.560Z", "surgeRules": []}	IN	\N	\N	\N	\N	2026-05-06 17:11:19.56+05:30	2026-05-06 17:11:19.56+05:30
69fb28e54e1d6b9cb1e2c90f	{"_id": "69fb28e54e1d6b9cb1e2c90f", "country": "AE", "currency": "AED", "basePrice": 334, "createdAt": "2026-05-06T11:41:25.350Z", "serviceId": "69fb01ae46a7a8a8c7b31783", "updatedAt": "2026-05-06T11:41:25.350Z", "surgeRules": []}	AE	\N	\N	\N	\N	2026-05-06 17:11:25.35+05:30	2026-05-06 17:11:25.35+05:30
\.


--
-- Data for Name: idempotency; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.idempotency (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5144e1d6b9cb1e2c76b	{"_id": "69faa5144e1d6b9cb1e2c76b", "pmId": "69faa5134e1d6b9cb1e2c751", "title": "React Dashboard Development", "status": "completed", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "pricing": {"hours": 8, "total": 7552, "currency": "INR", "hourlyRate": 800}, "schedule": {"endTime": "2026-04-27T02:19:00.849Z", "startTime": "2026-04-26T02:19:00.849Z"}, "bookingId": "69faa51424729f95617814de", "createdAt": "2026-05-06T02:18:56.927Z", "serviceId": null, "updatedAt": "2026-05-06T14:08:43.953Z", "resourceId": "69faa5134e1d6b9cb1e2c752", "description": "Build a dashboard with React and Recharts, integrate REST APIs.", "servicesStatus": "completed"}	IN	completed	69faa5134e1d6b9cb1e2c755	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c752	2026-05-06 07:48:56.927+05:30	2026-05-06 19:38:43.953+05:30
69faa5144e1d6b9cb1e2c76c	{"_id": "69faa5144e1d6b9cb1e2c76c", "pmId": "69faa5134e1d6b9cb1e2c751", "title": "Flutter App Enhancement", "status": "ongoing", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "pricing": {"hours": 16, "total": 13216, "currency": "INR", "hourlyRate": 700}, "schedule": {"endTime": "2026-05-11T02:19:00.879Z", "startTime": "2026-05-04T02:19:00.879Z"}, "bookingId": "69faa51424729f95617814df", "createdAt": "2026-05-06T02:18:56.927Z", "serviceId": null, "updatedAt": "2026-05-06T14:08:44.159Z", "resourceId": "69faa5134e1d6b9cb1e2c753", "description": "Add push notifications and offline mode.", "servicesStatus": "ongoing"}	IN	ongoing	69faa5134e1d6b9cb1e2c755	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c753	2026-05-06 07:48:56.927+05:30	2026-05-06 19:38:44.159+05:30
69faa6a5d86bfbc6283aaad9	{"_id": "69faa6a5d86bfbc6283aaad9", "logs": [], "pmId": "69faa5134e1d6b9cb1e2c751", "title": "API Development", "status": "assigned_to_pm", "userId": "69faa69b4e1d6b9cb1e2c7a0", "country": "IN", "endTime": "13:00", "history": [{"at": "2026-05-06T02:25:43.267Z", "note": "Auto-assigned to PM Priya Sharma", "event": "auto_assigned_pm", "actorRole": "system"}], "pricing": {"tax": 1368, "total": 8968, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 7600, "taxInclusive": true}, "services": [{"endTime": "13:00", "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "serviceId": "69faa5144e1d6b9cb1e2c764", "startTime": "09:00", "bookingType": "instant", "durationTime": 8, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f956178149c"], "preferredEndDate": "2026-05-06T02:23:11.554Z", "preferredStartDate": "2026-05-06T02:23:11.554Z"}], "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "createdAt": "2026-05-06T02:25:41.191Z", "serviceId": "69faa5144e1d6b9cb1e2c764", "startTime": "09:00", "updatedAt": "2026-05-06T02:25:43.267Z", "bookingType": "instant", "durationTime": 8, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f956178149c"], "autoAssignedAt": "2026-05-06T02:25:43.267Z", "projectManager": {"_id": "69faa5134e1d6b9cb1e2c751", "name": "Priya Sharma", "mobile": "9000000001"}, "preferredEndDate": "2026-05-06T02:23:11.554Z", "preferredStartDate": "2026-05-06T02:23:11.554Z"}	IN	assigned_to_pm	69faa69b4e1d6b9cb1e2c7a0	69faa5134e1d6b9cb1e2c751	\N	2026-05-06 07:55:41.191+05:30	2026-05-06 07:55:43.267+05:30
69facc5531bca016f25fe46a	{"_id": "69facc5531bca016f25fe46a", "logs": [], "pmId": "69faa5134e1d6b9cb1e2c751", "title": "Blog Writing", "status": "assigned_to_pm", "userId": "69faa69b4e1d6b9cb1e2c7a0", "country": "IN", "endTime": "13:00", "history": [{"at": "2026-05-06T05:06:31.465Z", "note": "Auto-assigned to PM Priya Sharma", "event": "auto_assigned_pm", "actorRole": "system"}], "pricing": {"tax": 576, "total": 3776, "hourly": 800, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 3200, "taxInclusive": true}, "services": [{"endTime": "13:00", "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "serviceId": "69faa5144e1d6b9cb1e2c76a", "startTime": "09:00", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f95617814d6", "69faa51324729f95617814d8"], "preferredEndDate": "2026-05-11T00:00:00.000", "preferredStartDate": "2026-05-11T00:00:00.000"}], "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "createdAt": "2026-05-06T05:06:29.241Z", "serviceId": "69faa5144e1d6b9cb1e2c76a", "startTime": "09:00", "updatedAt": "2026-05-06T05:06:31.465Z", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f95617814d6", "69faa51324729f95617814d8"], "autoAssignedAt": "2026-05-06T05:06:31.465Z", "projectManager": {"_id": "69faa5134e1d6b9cb1e2c751", "name": "Priya Sharma", "mobile": "9000000001"}, "preferredEndDate": "2026-05-11T00:00:00.000", "preferredStartDate": "2026-05-11T00:00:00.000"}	IN	assigned_to_pm	69faa69b4e1d6b9cb1e2c7a0	69faa5134e1d6b9cb1e2c751	\N	2026-05-06 10:36:29.241+05:30	2026-05-06 10:36:31.465+05:30
69fada78e8408cd6d70ee6b0	{"_id": "69fada78e8408cd6d70ee6b0", "logs": [], "pmId": "69faa5134e1d6b9cb1e2c751", "title": "Third Party Integration", "status": "assigned_to_pm", "userId": "69fada674e1d6b9cb1e2c7d8", "country": "IN", "endTime": "18:00", "pricing": {"tax": 1368, "total": 8968, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 7600, "taxInclusive": true}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "09:00"}, "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "09:00", "bookingType": "schedule", "durationTime": 8, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781476"], "preferredEndDate": "2026-05-07T00:00:00.000", "preferredStartDate": "2026-05-07T00:00:00.000"}], "timeSlot": {"endTime": "18:00", "startTime": "09:00"}, "createdAt": "2026-05-06T06:06:48.062Z", "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "09:00", "updatedAt": "2026-05-06T06:07:52.931Z", "bookingType": "schedule", "durationTime": 8, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781476"], "projectManager": {"_id": "69faa5134e1d6b9cb1e2c751", "name": "Priya Sharma", "mobile": "9000000001"}, "preferredEndDate": "2026-05-07T00:00:00.000", "preferredStartDate": "2026-05-07T00:00:00.000"}	IN	assigned_to_pm	69fada674e1d6b9cb1e2c7d8	69faa5134e1d6b9cb1e2c751	\N	2026-05-06 11:36:48.062+05:30	2026-05-06 11:37:52.931+05:30
69fadbb1e8408cd6d70ee6c0	{"_id": "69fadbb1e8408cd6d70ee6c0", "logs": [], "title": "Third Party Integration", "status": "pending", "userId": "69fadb914e1d6b9cb1e2c7de", "country": "IN", "endTime": "18:00", "pricing": {"tax": 684, "total": 4484, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 3800, "taxInclusive": true}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "14:00", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781476"], "preferredEndDate": "2026-05-11T00:00:00.000", "preferredStartDate": "2026-05-11T00:00:00.000"}], "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "createdAt": "2026-05-06T06:12:01.058Z", "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "14:00", "updatedAt": "2026-05-06T06:12:01.058Z", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781476"], "preferredEndDate": "2026-05-11T00:00:00.000", "preferredStartDate": "2026-05-11T00:00:00.000"}	IN	pending	69fadb914e1d6b9cb1e2c7de	\N	\N	2026-05-06 11:42:01.058+05:30	2026-05-06 11:42:01.058+05:30
69fae04fe8408cd6d70ee6c4	{"_id": "69fae04fe8408cd6d70ee6c4", "logs": [], "title": "Third Party Integration", "status": "pending", "userId": "69fae0044e1d6b9cb1e2c7f1", "country": "IN", "endTime": "18:00", "pricing": {"tax": 684, "total": 4484, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 3800, "taxInclusive": true}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "14:00", "bookingType": "instant", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781478"], "preferredEndDate": "2026-05-06T06:31:36.130Z", "preferredStartDate": "2026-05-06T06:31:36.130Z"}], "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "createdAt": "2026-05-06T06:31:42.874Z", "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "14:00", "updatedAt": "2026-05-06T06:31:42.874Z", "bookingType": "instant", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781478"], "preferredEndDate": "2026-05-06T06:31:36.130Z", "preferredStartDate": "2026-05-06T06:31:36.130Z"}	IN	pending	69fae0044e1d6b9cb1e2c7f1	\N	\N	2026-05-06 12:01:42.874+05:30	2026-05-06 12:01:42.874+05:30
69fae1d7e8408cd6d70ee6c6	{"_id": "69fae1d7e8408cd6d70ee6c6", "logs": [], "title": "Third Party Integration", "status": "pending", "userId": "69fae0044e1d6b9cb1e2c7f1", "country": "IN", "endTime": "13:00", "pricing": {"tax": 684, "total": 4484, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 3800, "taxInclusive": true}, "services": [{"endTime": "13:00", "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "09:00", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781476"], "preferredEndDate": "2026-05-08T00:00:00.000", "preferredStartDate": "2026-05-08T00:00:00.000"}], "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "createdAt": "2026-05-06T06:38:15.599Z", "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "09:00", "updatedAt": "2026-05-06T06:38:15.599Z", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781476"], "preferredEndDate": "2026-05-08T00:00:00.000", "preferredStartDate": "2026-05-08T00:00:00.000"}	IN	pending	69fae0044e1d6b9cb1e2c7f1	\N	\N	2026-05-06 12:08:15.599+05:30	2026-05-06 12:08:15.599+05:30
69fae1ef70ba1868817afc5a	{"_id": "69fae1ef70ba1868817afc5a", "logs": [], "title": "Third Party Integration", "status": "pending", "userId": "69faa69b4e1d6b9cb1e2c7a0", "country": "IN", "endTime": "18:00", "pricing": {"tax": 684, "total": 4484, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 3800, "taxInclusive": true}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "14:00", "bookingType": "instant", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781476"], "preferredEndDate": "2026-05-06T06:38:38.818Z", "preferredStartDate": "2026-05-06T06:38:38.818Z"}], "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "createdAt": "2026-05-06T06:38:39.614Z", "serviceId": "69faa5144e1d6b9cb1e2c761", "startTime": "14:00", "updatedAt": "2026-05-06T06:38:39.614Z", "bookingType": "instant", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f9561781476"], "preferredEndDate": "2026-05-06T06:38:38.818Z", "preferredStartDate": "2026-05-06T06:38:38.818Z"}	IN	pending	69faa69b4e1d6b9cb1e2c7a0	\N	\N	2026-05-06 12:08:39.614+05:30	2026-05-06 12:08:39.614+05:30
69fae5b14afd78c53a2ced35	{"_id": "69fae5b14afd78c53a2ced35", "logs": [], "title": "SEO", "status": "pending", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "endTime": "13:00", "pricing": {"tax": 1296, "total": 8496, "hourly": 900, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 7200, "taxInclusive": true}, "services": [{"endTime": "13:00", "serviceId": "69faa5144e1d6b9cb1e2c769", "startTime": "09:00", "bookingType": "later", "durationTime": 8, "selectedDays": 1, "preferredStartDate": "2026-05-08"}], "timeSlot": null, "createdAt": "2026-05-06T06:54:40.927Z", "serviceId": "69faa5144e1d6b9cb1e2c769", "startTime": "09:00", "updatedAt": "2026-05-06T06:54:40.927Z", "bookingType": "later", "durationTime": 8, "requirements": "", "selectedDays": 1, "technologyIds": [], "preferredEndDate": null, "preferredStartDate": "2026-05-08"}	IN	pending	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 12:24:40.927+05:30	2026-05-06 12:24:40.927+05:30
69fae776295d34e9cc656485	{"_id": "69fae776295d34e9cc656485", "logs": [], "title": "SEO", "status": "pending", "userId": "69fae7544e1d6b9cb1e2c7fc", "country": "IN", "endTime": "18:00", "pricing": {"tax": 648, "total": 4248, "hourly": 900, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 3600, "taxInclusive": true}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "serviceId": "69faa5144e1d6b9cb1e2c769", "startTime": "14:00", "bookingType": "instant", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f95617814cb", "69faa51324729f95617814cc", "69faa51324729f95617814ce"], "preferredEndDate": "2026-05-06T07:01:16.429Z", "preferredStartDate": "2026-05-06T07:01:16.429Z"}], "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "createdAt": "2026-05-06T07:02:14.001Z", "serviceId": "69faa5144e1d6b9cb1e2c769", "startTime": "14:00", "updatedAt": "2026-05-06T07:02:14.001Z", "bookingType": "instant", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69faa51324729f95617814cb", "69faa51324729f95617814cc", "69faa51324729f95617814ce"], "preferredEndDate": "2026-05-06T07:01:16.429Z", "preferredStartDate": "2026-05-06T07:01:16.429Z"}	IN	pending	69fae7544e1d6b9cb1e2c7fc	\N	\N	2026-05-06 12:32:14.001+05:30	2026-05-06 12:32:14.001+05:30
69fae7b9295d34e9cc656487	{"_id": "69fae7b9295d34e9cc656487", "logs": [], "title": "SEO", "status": "pending", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "endTime": "13:00", "pricing": {"tax": 1296, "total": 8496, "hourly": 900, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 7200, "taxInclusive": true}, "services": [{"endTime": "13:00", "serviceId": "69faa5144e1d6b9cb1e2c769", "startTime": "09:00", "bookingType": "later", "durationTime": 8, "selectedDays": 1, "preferredStartDate": "2026-05-08"}], "timeSlot": null, "createdAt": "2026-05-06T07:03:21.336Z", "serviceId": "69faa5144e1d6b9cb1e2c769", "startTime": "09:00", "updatedAt": "2026-05-06T07:03:21.336Z", "bookingType": "later", "durationTime": 8, "requirements": "", "selectedDays": 1, "technologyIds": [], "preferredEndDate": null, "preferredStartDate": "2026-05-08"}	IN	pending	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 12:33:21.336+05:30	2026-05-06 12:33:21.336+05:30
69fae8994e1d6b9cb1e2c818	{"_id": "69fae8994e1d6b9cb1e2c818", "pmId": "69faa5134e1d6b9cb1e2c751", "title": "React Dashboard Development", "status": "completed", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "pricing": {"hours": 8, "total": 7552, "currency": "INR", "hourlyRate": 800}, "schedule": {"endTime": "2026-04-27T07:07:05.916Z", "startTime": "2026-04-26T07:07:05.916Z"}, "bookingId": "69fae89975ed7035320450d0", "createdAt": "2026-05-06T07:07:01.458Z", "serviceId": null, "updatedAt": "2026-05-06T14:08:43.895Z", "resourceId": "69faa5134e1d6b9cb1e2c752", "description": "Build a dashboard with React and Recharts, integrate REST APIs.", "servicesStatus": "completed"}	IN	completed	69faa5134e1d6b9cb1e2c755	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c752	2026-05-06 12:37:01.458+05:30	2026-05-06 19:38:43.895+05:30
69fae89a4e1d6b9cb1e2c819	{"_id": "69fae89a4e1d6b9cb1e2c819", "pmId": "69faa5134e1d6b9cb1e2c751", "title": "Flutter App Enhancement", "status": "ongoing", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "pricing": {"hours": 16, "total": 13216, "currency": "INR", "hourlyRate": 700}, "schedule": {"endTime": "2026-05-11T07:07:05.967Z", "startTime": "2026-05-04T07:07:05.967Z"}, "bookingId": "69fae89975ed7035320450d1", "createdAt": "2026-05-06T07:07:01.458Z", "serviceId": null, "updatedAt": "2026-05-06T14:08:44.101Z", "resourceId": "69faa5134e1d6b9cb1e2c753", "description": "Add push notifications and offline mode.", "servicesStatus": "ongoing"}	IN	ongoing	69faa5134e1d6b9cb1e2c755	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c753	2026-05-06 12:37:01.458+05:30	2026-05-06 19:38:44.101+05:30
69fae8c4295d34e9cc656488	{"_id": "69fae8c4295d34e9cc656488", "logs": [], "title": "Third Party Integration", "status": "pending", "userId": "69fae7544e1d6b9cb1e2c7fc", "country": "IN", "endTime": "18:00", "pricing": {"tax": 684, "total": 4484, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 3800, "taxInclusive": true}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "serviceId": "69fae8984e1d6b9cb1e2c80e", "startTime": "14:00", "bookingType": "instant", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69fae89875ed703532045068", "69fae89875ed70353204506a"], "preferredEndDate": "2026-05-06T07:07:43.213Z", "preferredStartDate": "2026-05-06T07:07:43.213Z"}], "timeSlot": {"endTime": "18:00", "startTime": "14:00"}, "createdAt": "2026-05-06T07:07:48.117Z", "serviceId": "69fae8984e1d6b9cb1e2c80e", "startTime": "14:00", "updatedAt": "2026-05-06T07:07:48.117Z", "bookingType": "instant", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69fae89875ed703532045068", "69fae89875ed70353204506a"], "preferredEndDate": "2026-05-06T07:07:43.213Z", "preferredStartDate": "2026-05-06T07:07:43.213Z"}	IN	pending	69fae7544e1d6b9cb1e2c7fc	\N	\N	2026-05-06 12:37:48.117+05:30	2026-05-06 12:37:48.117+05:30
69faeaeb86202e843ee0da5c	{"_id": "69faeaeb86202e843ee0da5c", "logs": [], "title": "Third Party Integration", "status": "pending", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "endTime": "13:00", "pricing": {"tax": 1368, "total": 8968, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 7600, "taxInclusive": true}, "services": [{"endTime": "13:00", "serviceId": "69fae8984e1d6b9cb1e2c80e", "startTime": "09:00", "bookingType": "later", "durationTime": 8, "selectedDays": 1, "preferredStartDate": "2026-05-08"}], "timeSlot": null, "createdAt": "2026-05-06T07:16:59.257Z", "serviceId": "69fae8984e1d6b9cb1e2c80e", "startTime": "09:00", "updatedAt": "2026-05-06T07:16:59.257Z", "bookingType": "later", "durationTime": 8, "requirements": "", "selectedDays": 1, "technologyIds": [], "preferredEndDate": null, "preferredStartDate": "2026-05-08"}	IN	pending	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 12:46:59.257+05:30	2026-05-06 12:46:59.257+05:30
69faebe0e98c8a5737e82d9c	{"_id": "69faebe0e98c8a5737e82d9c", "logs": [], "pmId": "69faa5134e1d6b9cb1e2c751", "title": "Third Party Integration", "status": "assigned_to_pm", "userId": "69faebd14e1d6b9cb1e2c82d", "country": "IN", "endTime": "18:00", "pricing": {"tax": 1368, "total": 8968, "hourly": 950, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 7600, "taxInclusive": true}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "09:00"}, "serviceId": "69fae8984e1d6b9cb1e2c80e", "startTime": "09:00", "bookingType": "schedule", "durationTime": 8, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69fae89875ed703532045068", "69fae89875ed70353204506a"], "preferredEndDate": "2026-05-07T00:00:00.000", "preferredStartDate": "2026-05-07T00:00:00.000"}], "timeSlot": {"endTime": "18:00", "startTime": "09:00"}, "createdAt": "2026-05-06T07:21:04.083Z", "serviceId": "69fae8984e1d6b9cb1e2c80e", "startTime": "09:00", "updatedAt": "2026-05-06T07:23:37.780Z", "resourceId": "69faa5134e1d6b9cb1e2c753", "bookingType": "schedule", "durationTime": 8, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["69fae89875ed703532045068", "69fae89875ed70353204506a"], "projectManager": {"_id": "69faa5134e1d6b9cb1e2c751", "name": "Priya Sharma", "mobile": "9000000001"}, "assignedResource": {"_id": "69faa5134e1d6b9cb1e2c753", "name": "Sneha Patel", "mobile": "9000000003"}, "preferredEndDate": "2026-05-07T00:00:00.000", "preferredStartDate": "2026-05-07T00:00:00.000"}	IN	assigned_to_pm	69faebd14e1d6b9cb1e2c82d	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c753	2026-05-06 12:51:04.083+05:30	2026-05-06 12:53:37.78+05:30
69fb12ffe98c8a5737e82db5	{"_id": "69fb12ffe98c8a5737e82db5", "logs": [], "pmId": "69faa5134e1d6b9cb1e2c751", "title": "AI Engineers", "status": "assigned_to_pm", "userId": "69fb12f84e1d6b9cb1e2c8e6", "country": "IN", "endTime": "18:00", "pricing": {"tax": 2160, "total": 14160, "hourly": 1500, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 12000, "taxInclusive": true}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "09:00"}, "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "bookingType": "schedule", "durationTime": 8, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["gen_ai_solutions"], "preferredEndDate": "2026-05-07T00:00:00.000", "preferredStartDate": "2026-05-07T00:00:00.000"}], "timeSlot": {"endTime": "18:00", "startTime": "09:00"}, "createdAt": "2026-05-06T10:07:59.849Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "updatedAt": "2026-05-06T10:10:50.636Z", "resourceId": "69faa5134e1d6b9cb1e2c754", "bookingType": "schedule", "durationTime": 8, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["gen_ai_solutions"], "projectManager": {"_id": "69faa5134e1d6b9cb1e2c751", "name": "Priya Sharma", "mobile": "9000000001"}, "assignedResource": {"_id": "69faa5134e1d6b9cb1e2c754", "name": "Rahul Verma", "mobile": "9000000004"}, "preferredEndDate": "2026-05-07T00:00:00.000", "preferredStartDate": "2026-05-07T00:00:00.000"}	IN	assigned_to_pm	69fb12f84e1d6b9cb1e2c8e6	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c754	2026-05-06 15:37:59.849+05:30	2026-05-06 15:40:50.636+05:30
69fb2756e98c8a5737e82dc4	{"_id": "69fb2756e98c8a5737e82dc4", "logs": [], "pmId": "69faa5134e1d6b9cb1e2c751", "title": "AI Engineers", "status": "completed", "userId": "69faa5134e1d6b9cb1e2c756", "country": "IN", "endTime": "13:00", "history": [{"at": "2026-05-06T11:37:58.315Z", "note": "PM started work", "event": "work_started", "actorId": "69faa5134e1d6b9cb1e2c751", "actorRole": "pm"}, {"at": "2026-05-06T11:37:59.987Z", "note": "PM stopped work", "event": "work_stopped", "actorId": "69faa5134e1d6b9cb1e2c751", "actorRole": "pm", "sessionMs": 1672}, {"at": "2026-05-06T11:38:01.053Z", "note": "PM started work", "event": "work_started", "actorId": "69faa5134e1d6b9cb1e2c751", "actorRole": "pm"}, {"at": "2026-05-06T11:38:52.633Z", "note": "PM marked complete", "event": "completed", "actorId": "69faa5134e1d6b9cb1e2c751", "actorRole": "pm"}], "pricing": {"tax": 1080, "total": 7080, "hourly": 1500, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 6000, "taxInclusive": true}, "services": [{"endTime": "13:00", "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["gen_ai_solutions"], "preferredEndDate": "2026-05-12T00:00:00.000", "preferredStartDate": "2026-05-12T00:00:00.000"}], "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "workedMs": 53252, "createdAt": "2026-05-06T11:34:46.212Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "startedAt": "2026-05-06T11:37:58.315Z", "updatedAt": "2026-05-06T11:38:52.633Z", "resourceId": "69faa5134e1d6b9cb1e2c752", "bookingType": "schedule", "completedAt": "2026-05-06T11:38:52.633Z", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "lastStoppedAt": "2026-05-06T11:37:59.987Z", "technologyIds": ["gen_ai_solutions"], "projectManager": {"_id": "69faa5134e1d6b9cb1e2c751", "name": "Priya Sharma", "mobile": "9000000001"}, "assignedResource": {"_id": "69faa5134e1d6b9cb1e2c752", "name": "Arjun Mehta", "mobile": "9000000002"}, "preferredEndDate": "2026-05-12T00:00:00.000", "preferredStartDate": "2026-05-12T00:00:00.000", "currentSessionStart": null}	IN	completed	69faa5134e1d6b9cb1e2c756	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c752	2026-05-06 17:04:46.212+05:30	2026-05-06 17:08:52.633+05:30
69fb3410e98c8a5737e82de8	{"_id": "69fb3410e98c8a5737e82de8", "logs": [], "pmId": "69faa5134e1d6b9cb1e2c751", "title": "AI Engineers", "status": "assigned_to_pm", "userId": "69fb33f44e1d6b9cb1e2c930", "country": "DE", "endTime": "18:00", "history": [{"at": "2026-05-06T12:29:06.580Z", "note": "Auto-assigned to PM Priya Sharma", "event": "auto_assigned_pm", "actorRole": "system"}], "pricing": {"tax": 97.28, "total": 609.28, "hourly": 16, "taxName": "MwSt.", "taxRate": 0.19, "taxType": "vat", "currency": "EUR", "subtotal": 512, "taxInclusive": false}, "services": [{"endTime": "18:00", "timeSlot": {"endTime": "18:00", "startTime": "09:00"}, "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "bookingType": "schedule", "durationTime": 32, "requirements": "Selected from web v3", "selectedDays": 4, "technologyIds": ["gen-ki-lösungen"], "preferredEndDate": "2026-05-07T00:00:00.000", "preferredStartDate": "2026-05-07T00:00:00.000"}], "timeSlot": {"endTime": "18:00", "startTime": "09:00"}, "createdAt": "2026-05-06T12:29:04.182Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "updatedAt": "2026-05-06T12:45:02.778Z", "resourceId": "69faa5134e1d6b9cb1e2c752", "bookingType": "schedule", "cancelReason": "", "durationTime": 32, "requirements": "Selected from web v3", "selectedDays": 4, "technologyIds": ["gen-ki-lösungen"], "autoAssignedAt": "2026-05-06T12:29:06.580Z", "projectManager": {"_id": "69faa5134e1d6b9cb1e2c751", "name": "Priya Sharma", "mobile": "9000000001"}, "assignedResource": {"_id": "69faa5134e1d6b9cb1e2c752", "name": "Arjun Mehta", "mobile": "9000000002"}, "preferredEndDate": "2026-05-07T00:00:00.000", "preferredStartDate": "2026-05-07T00:00:00.000"}	DE	assigned_to_pm	69fb33f44e1d6b9cb1e2c930	69faa5134e1d6b9cb1e2c751	69faa5134e1d6b9cb1e2c752	2026-05-06 17:59:04.182+05:30	2026-05-06 18:15:02.778+05:30
69fb3444e98c8a5737e82dec	{"_id": "69fb3444e98c8a5737e82dec", "logs": [], "title": "IT Support", "status": "pending", "userId": "69fb33f44e1d6b9cb1e2c930", "country": "DE", "endTime": "13:00", "pricing": {"tax": 8.36, "total": 52.36, "hourly": 11, "taxName": "MwSt.", "taxRate": 0.19, "taxType": "vat", "currency": "EUR", "subtotal": 44, "taxInclusive": false}, "services": [{"endTime": "13:00", "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "serviceId": "69fb01ae46a7a8a8c7b31775", "startTime": "09:00", "bookingType": "later", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["serveradministration"], "preferredEndDate": "2026-05-08T00:00:00.000", "preferredStartDate": "2026-05-08T00:00:00.000"}], "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "createdAt": "2026-05-06T12:29:56.208Z", "serviceId": "69fb01ae46a7a8a8c7b31775", "startTime": "09:00", "updatedAt": "2026-05-06T12:29:56.208Z", "bookingType": "later", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["serveradministration"], "preferredEndDate": "2026-05-08T00:00:00.000", "preferredStartDate": "2026-05-08T00:00:00.000"}	DE	pending	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 17:59:56.208+05:30	2026-05-06 17:59:56.208+05:30
69fb384be98c8a5737e82dfb	{"_id": "69fb384be98c8a5737e82dfb", "logs": [], "pmId": "69faa5134e1d6b9cb1e2c751", "title": "AI Engineers", "status": "assigned_to_pm", "userId": "69fb33f44e1d6b9cb1e2c930", "country": "IN", "endTime": "13:00", "pricing": {"tax": 1080, "total": 7080, "hourly": 1500, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 6000, "taxInclusive": true}, "services": [{"endTime": "13:00", "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["gen_ai_solutions", "llm_integration"], "preferredEndDate": "2026-05-08T00:00:00.000", "preferredStartDate": "2026-05-08T00:00:00.000"}], "timeSlot": {"endTime": "13:00", "startTime": "09:00"}, "createdAt": "2026-05-06T12:47:07.514Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "updatedAt": "2026-05-06T12:52:34.993Z", "resourceId": "69fb3985e98c8a5737e82e0e", "bookingType": "schedule", "durationTime": 4, "requirements": "Selected from web v3", "selectedDays": 1, "technologyIds": ["gen_ai_solutions", "llm_integration"], "projectManager": {"_id": "69faa5134e1d6b9cb1e2c751", "name": "Priya Sharma", "mobile": "9000000001"}, "assignedResource": {"_id": "69fb3985e98c8a5737e82e0e", "name": "skjshaxdciwuds", "mobile": "9876543567"}, "preferredEndDate": "2026-05-08T00:00:00.000", "preferredStartDate": "2026-05-08T00:00:00.000"}	IN	assigned_to_pm	69fb33f44e1d6b9cb1e2c930	69faa5134e1d6b9cb1e2c751	69fb3985e98c8a5737e82e0e	2026-05-06 18:17:07.514+05:30	2026-05-06 18:22:34.993+05:30
69fb5508ed817c143dc9bf44	{"_id": "69fb5508ed817c143dc9bf44", "logs": [], "title": "AI Engineers", "status": "pending", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "endTime": "13:00", "pricing": {"tax": 1080, "total": 7080, "hourly": 1500, "taxName": "GST", "taxRate": 0.18, "taxType": "gst", "currency": "INR", "subtotal": 6000, "taxInclusive": true}, "services": [{"endTime": "13:00", "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "bookingType": "later", "durationTime": 4, "selectedDays": 1, "preferredStartDate": "2026-05-11"}], "timeSlot": null, "createdAt": "2026-05-06T14:49:44.056Z", "serviceId": "69fb01ae46a7a8a8c7b31771", "startTime": "09:00", "updatedAt": "2026-05-06T14:49:44.056Z", "bookingType": "later", "durationTime": 4, "requirements": "", "selectedDays": 1, "technologyIds": [], "preferredEndDate": null, "preferredStartDate": "2026-05-11"}	IN	pending	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 20:19:44.056+05:30	2026-05-06 20:19:44.056+05:30
\.


--
-- Data for Name: legal_acceptances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.legal_acceptances (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: legal_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.legal_documents (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_templates (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5154e1d6b9cb1e2c772	{"_id": "69faa5154e1d6b9cb1e2c772", "key": "booking_confirmed", "body": "Your {{service}} booking is confirmed. Your PM {{pm_name}} will connect within 10 minutes.", "title": "Booking Confirmed 🎉", "channels": ["push", "email"], "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c773	{"_id": "69faa5154e1d6b9cb1e2c773", "key": "booking_started", "body": "{{resource_name}} has started working on your project. Track progress in the app.", "title": "Work Started", "channels": ["push"], "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c774	{"_id": "69faa5154e1d6b9cb1e2c774", "key": "booking_completed", "body": "Your {{service}} session is complete. Please leave a review!", "title": "Booking Completed", "channels": ["push", "email"], "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c775	{"_id": "69faa5154e1d6b9cb1e2c775", "key": "booking_cancelled", "body": "Your booking has been cancelled. Refund will be processed in 5–7 business days.", "title": "Booking Cancelled", "channels": ["push", "email"], "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c776	{"_id": "69faa5154e1d6b9cb1e2c776", "key": "otp_sent", "body": "Your QuickHire OTP is {{otp}}. Valid for 5 minutes. Do not share it.", "title": "Your OTP", "channels": ["sms"], "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c777	{"_id": "69faa5154e1d6b9cb1e2c777", "key": "payment_success", "body": "Payment of ₹{{amount}} for {{service}} received successfully. Order ID: {{order_id}}", "title": "Payment Received", "channels": ["push", "email"], "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5154e1d6b9cb1e2c770	{"_id": "69faa5154e1d6b9cb1e2c770", "body": "Your React Developer booking has been confirmed. Your PM will connect shortly.", "data": {"bookingId": "69faa51424729f95617814de"}, "read": true, "type": "booking_confirmed_seed", "title": "Booking Confirmed", "userId": "69faa5134e1d6b9cb1e2c755", "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c771	{"_id": "69faa5154e1d6b9cb1e2c771", "body": "Sneha has started working on your Flutter app. Check the chat for updates.", "data": {"bookingId": "69faa51424729f95617814df"}, "read": false, "type": "booking_ongoing_seed", "title": "Work in Progress", "userId": "69faa5134e1d6b9cb1e2c755", "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z"}	\N	\N	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa6a7dbc2ae557657dfb8	{"_id": "69faa6a7dbc2ae557657dfb8", "body": "You have been assigned booking 283aaad9. Please start the work when ready.", "data": {"bookingId": "69faa6a5d86bfbc6283aaad9"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T02:25:43.474Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 07:55:43.474+05:30	\N
69faa6a7d86bfbc6283aaadb	{"_id": "69faa6a7d86bfbc6283aaadb", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69faa6a5d86bfbc6283aaad9"}, "read": true, "type": "booking_assigned", "title": "Project Manager assigned", "readAt": "2026-05-06T02:25:57.295Z", "userId": "69faa69b4e1d6b9cb1e2c7a0", "channels": ["in_app", "push"], "createdAt": "2026-05-06T02:25:43.538Z"}	\N	\N	69faa69b4e1d6b9cb1e2c7a0	\N	\N	2026-05-06 07:55:43.538+05:30	\N
69faa6a7dbc2ae557657dfb9	{"_id": "69faa6a7dbc2ae557657dfb9", "body": "Booking 283aaad9 paid. Auto-assigned to Priya Sharma.", "data": {"pmId": "69faa5134e1d6b9cb1e2c751", "bookingId": "69faa6a5d86bfbc6283aaad9"}, "read": false, "type": "booking_paid", "title": "Booking paid & PM assigned", "userId": "69faa5134e1d6b9cb1e2c750", "channels": ["in_app", "push"], "createdAt": "2026-05-06T02:25:43.603Z"}	\N	\N	69faa5134e1d6b9cb1e2c750	\N	\N	2026-05-06 07:55:43.603+05:30	\N
69facc5731bca016f25fe46e	{"_id": "69facc5731bca016f25fe46e", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69facc5531bca016f25fe46a"}, "read": false, "type": "booking_assigned", "title": "Project Manager assigned", "userId": "69faa69b4e1d6b9cb1e2c7a0", "channels": ["in_app", "push"], "createdAt": "2026-05-06T05:06:31.859Z"}	\N	\N	69faa69b4e1d6b9cb1e2c7a0	\N	\N	2026-05-06 10:36:31.859+05:30	\N
69facc5731bca016f25fe46c	{"_id": "69facc5731bca016f25fe46c", "body": "You have been assigned booking f25fe46a. Please start the work when ready.", "data": {"bookingId": "69facc5531bca016f25fe46a"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T05:06:31.858Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 10:36:31.858+05:30	\N
69facc5731bca016f25fe46d	{"_id": "69facc5731bca016f25fe46d", "body": "Booking f25fe46a paid. Auto-assigned to Priya Sharma.", "data": {"pmId": "69faa5134e1d6b9cb1e2c751", "bookingId": "69facc5531bca016f25fe46a"}, "read": false, "type": "booking_paid", "title": "Booking paid & PM assigned", "userId": "69faa5134e1d6b9cb1e2c750", "channels": ["in_app", "push"], "createdAt": "2026-05-06T05:06:31.858Z"}	\N	\N	69faa5134e1d6b9cb1e2c750	\N	\N	2026-05-06 10:36:31.858+05:30	\N
69fadab9e8408cd6d70ee6b4	{"_id": "69fadab9e8408cd6d70ee6b4", "body": "You have been assigned booking d70ee6b0.", "data": {"bookingId": "69fada78e8408cd6d70ee6b0"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T06:07:53.067Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 11:37:53.067+05:30	\N
69fadab9e8408cd6d70ee6b5	{"_id": "69fadab9e8408cd6d70ee6b5", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69fada78e8408cd6d70ee6b0"}, "read": true, "type": "booking_assigned", "title": "Project Manager assigned", "readAt": "2026-05-06T06:08:05.593Z", "userId": "69fada674e1d6b9cb1e2c7d8", "channels": ["in_app", "push"], "createdAt": "2026-05-06T06:07:53.121Z"}	\N	\N	69fada674e1d6b9cb1e2c7d8	\N	\N	2026-05-06 11:37:53.121+05:30	\N
69fadacce8408cd6d70ee6b8	{"_id": "69fadacce8408cd6d70ee6b8", "body": "Hello", "data": {"bookingId": "69fada78e8408cd6d70ee6b0"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69fada674e1d6b9cb1e2c7d8", "channels": ["in_app", "push"], "createdAt": "2026-05-06T06:08:12.346Z"}	\N	\N	69fada674e1d6b9cb1e2c7d8	\N	\N	2026-05-06 11:38:12.346+05:30	\N
69fadacce8408cd6d70ee6b9	{"_id": "69fadacce8408cd6d70ee6b9", "body": "Hello", "data": {"bookingId": "69fada78e8408cd6d70ee6b0"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T06:08:12.347Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 11:38:12.347+05:30	\N
69fadaede8408cd6d70ee6bc	{"_id": "69fadaede8408cd6d70ee6bc", "body": "hello", "data": {"bookingId": "69fada78e8408cd6d70ee6b0"}, "read": true, "type": "chat_message", "title": "Admin message", "readAt": "2026-05-06T06:09:01.740Z", "userId": "69fada674e1d6b9cb1e2c7d8", "channels": ["in_app", "push"], "createdAt": "2026-05-06T06:08:45.952Z"}	\N	\N	69fada674e1d6b9cb1e2c7d8	\N	\N	2026-05-06 11:38:45.952+05:30	\N
69fadaeee8408cd6d70ee6bd	{"_id": "69fadaeee8408cd6d70ee6bd", "body": "hello", "data": {"bookingId": "69fada78e8408cd6d70ee6b0"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T06:08:46.006Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 11:38:46.006+05:30	\N
69faec38e98c8a5737e82d9f	{"_id": "69faec38e98c8a5737e82d9f", "body": "You have been assigned booking 37e82d9c.", "data": {"bookingId": "69faebe0e98c8a5737e82d9c"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T07:22:32.172Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 12:52:32.172+05:30	\N
69faec38e98c8a5737e82da0	{"_id": "69faec38e98c8a5737e82da0", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69faebe0e98c8a5737e82d9c"}, "read": false, "type": "booking_assigned", "title": "Project Manager assigned", "userId": "69faebd14e1d6b9cb1e2c82d", "channels": ["in_app", "push"], "createdAt": "2026-05-06T07:22:32.222Z"}	\N	\N	69faebd14e1d6b9cb1e2c82d	\N	\N	2026-05-06 12:52:32.222+05:30	\N
69faec54e98c8a5737e82da5	{"_id": "69faec54e98c8a5737e82da5", "body": "hy", "data": {"bookingId": "69faebe0e98c8a5737e82d9c"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T07:23:00.897Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 12:53:00.897+05:30	\N
69faec54e98c8a5737e82da4	{"_id": "69faec54e98c8a5737e82da4", "body": "hy", "data": {"bookingId": "69faebe0e98c8a5737e82d9c"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faebd14e1d6b9cb1e2c82d", "channels": ["in_app", "push"], "createdAt": "2026-05-06T07:23:00.897Z"}	\N	\N	69faebd14e1d6b9cb1e2c82d	\N	\N	2026-05-06 12:53:00.897+05:30	\N
69faec62e98c8a5737e82da9	{"_id": "69faec62e98c8a5737e82da9", "body": "fagklfd", "data": {"bookingId": "69faebe0e98c8a5737e82d9c"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faebd14e1d6b9cb1e2c82d", "channels": ["in_app", "push"], "createdAt": "2026-05-06T07:23:14.397Z"}	\N	\N	69faebd14e1d6b9cb1e2c82d	\N	\N	2026-05-06 12:53:14.397+05:30	\N
69faec62e98c8a5737e82daa	{"_id": "69faec62e98c8a5737e82daa", "body": "fagklfd", "data": {"bookingId": "69faebe0e98c8a5737e82d9c"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T07:23:14.446Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 12:53:14.446+05:30	\N
69faec79e98c8a5737e82dad	{"_id": "69faec79e98c8a5737e82dad", "body": "You have been assigned to booking 37e82d9c.", "data": {"bookingId": "69faebe0e98c8a5737e82d9c"}, "read": false, "type": "assignment", "title": "New assignment", "userId": "69faa5134e1d6b9cb1e2c753", "channels": ["in_app", "push"], "createdAt": "2026-05-06T07:23:37.881Z"}	\N	\N	69faa5134e1d6b9cb1e2c753	\N	\N	2026-05-06 12:53:37.881+05:30	\N
69fb1375e98c8a5737e82db9	{"_id": "69fb1375e98c8a5737e82db9", "body": "HELLO", "data": {"bookingId": "69fb12ffe98c8a5737e82db5"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69fb12f84e1d6b9cb1e2c8e6", "channels": ["in_app", "push"], "createdAt": "2026-05-06T10:09:57.704Z"}	\N	\N	69fb12f84e1d6b9cb1e2c8e6	\N	\N	2026-05-06 15:39:57.704+05:30	\N
69fb1383e98c8a5737e82dbb	{"_id": "69fb1383e98c8a5737e82dbb", "body": "You have been assigned booking 37e82db5.", "data": {"bookingId": "69fb12ffe98c8a5737e82db5"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T10:10:11.145Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 15:40:11.145+05:30	\N
69fb1383e98c8a5737e82dbc	{"_id": "69fb1383e98c8a5737e82dbc", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69fb12ffe98c8a5737e82db5"}, "read": true, "type": "booking_assigned", "title": "Project Manager assigned", "readAt": "2026-05-06T10:10:45.733Z", "userId": "69fb12f84e1d6b9cb1e2c8e6", "channels": ["in_app", "push"], "createdAt": "2026-05-06T10:10:11.191Z"}	\N	\N	69fb12f84e1d6b9cb1e2c8e6	\N	\N	2026-05-06 15:40:11.191+05:30	\N
69fb1390e98c8a5737e82dbf	{"_id": "69fb1390e98c8a5737e82dbf", "body": "HELLO SIR", "data": {"bookingId": "69fb12ffe98c8a5737e82db5"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69fb12f84e1d6b9cb1e2c8e6", "channels": ["in_app", "push"], "createdAt": "2026-05-06T10:10:24.719Z"}	\N	\N	69fb12f84e1d6b9cb1e2c8e6	\N	\N	2026-05-06 15:40:24.719+05:30	\N
69fb1390e98c8a5737e82dc0	{"_id": "69fb1390e98c8a5737e82dc0", "body": "HELLO SIR", "data": {"bookingId": "69fb12ffe98c8a5737e82db5"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T10:10:24.764Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 15:40:24.764+05:30	\N
69fb13aae98c8a5737e82dc2	{"_id": "69fb13aae98c8a5737e82dc2", "body": "You have been assigned to booking 37e82db5.", "data": {"bookingId": "69fb12ffe98c8a5737e82db5"}, "read": false, "type": "assignment", "title": "New assignment", "userId": "69faa5134e1d6b9cb1e2c754", "channels": ["in_app", "push"], "createdAt": "2026-05-06T10:10:50.752Z"}	\N	\N	69faa5134e1d6b9cb1e2c754	\N	\N	2026-05-06 15:40:50.752+05:30	\N
69fb27d2e98c8a5737e82dc8	{"_id": "69fb27d2e98c8a5737e82dc8", "body": "You have been assigned booking 37e82dc4.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:36:50.401Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 17:06:50.401+05:30	\N
69fb27d2e98c8a5737e82dc9	{"_id": "69fb27d2e98c8a5737e82dc9", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": true, "type": "booking_assigned", "title": "Project Manager assigned", "readAt": "2026-05-06T11:37:03.449Z", "userId": "69faa5134e1d6b9cb1e2c756", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:36:50.401Z"}	\N	\N	69faa5134e1d6b9cb1e2c756	\N	\N	2026-05-06 17:06:50.401+05:30	\N
69fb27fde98c8a5737e82dcf	{"_id": "69fb27fde98c8a5737e82dcf", "body": "You have been assigned to booking 37e82dc4.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "assignment", "title": "New assignment", "userId": "69faa5134e1d6b9cb1e2c752", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:37:33.135Z"}	\N	\N	69faa5134e1d6b9cb1e2c752	\N	\N	2026-05-06 17:07:33.135+05:30	\N
69fb2816e98c8a5737e82dd2	{"_id": "69fb2816e98c8a5737e82dd2", "body": "Your project manager has started working on your booking.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "work_started", "title": "Work started", "userId": "69faa5134e1d6b9cb1e2c756", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:37:58.431Z"}	\N	\N	69faa5134e1d6b9cb1e2c756	\N	\N	2026-05-06 17:07:58.431+05:30	\N
69fb2816e98c8a5737e82dd3	{"_id": "69fb2816e98c8a5737e82dd3", "body": "Booking 37e82dc4 is now in progress.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "work_started", "title": "PM started work", "userId": "69faa5134e1d6b9cb1e2c750", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:37:58.478Z"}	\N	\N	69faa5134e1d6b9cb1e2c750	\N	\N	2026-05-06 17:07:58.478+05:30	\N
69fb2818e98c8a5737e82dd4	{"_id": "69fb2818e98c8a5737e82dd4", "body": "Your project manager has paused work on your booking.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "work_paused", "title": "Work paused", "userId": "69faa5134e1d6b9cb1e2c756", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:38:00.094Z"}	\N	\N	69faa5134e1d6b9cb1e2c756	\N	\N	2026-05-06 17:08:00.094+05:30	\N
69fb2819e98c8a5737e82dd5	{"_id": "69fb2819e98c8a5737e82dd5", "body": "Your project manager has started working on your booking.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "work_started", "title": "Work started", "userId": "69faa5134e1d6b9cb1e2c756", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:38:01.166Z"}	\N	\N	69faa5134e1d6b9cb1e2c756	\N	\N	2026-05-06 17:08:01.166+05:30	\N
69fb2819e98c8a5737e82dd6	{"_id": "69fb2819e98c8a5737e82dd6", "body": "Booking 37e82dc4 is now in progress.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "work_started", "title": "PM started work", "userId": "69faa5134e1d6b9cb1e2c750", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:38:01.213Z"}	\N	\N	69faa5134e1d6b9cb1e2c750	\N	\N	2026-05-06 17:08:01.213+05:30	\N
69fb2824e98c8a5737e82dd8	{"_id": "69fb2824e98c8a5737e82dd8", "body": "hello", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "chat_message", "title": "New chat message", "userId": "69faa5134e1d6b9cb1e2c756", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:38:12.047Z"}	\N	\N	69faa5134e1d6b9cb1e2c756	\N	\N	2026-05-06 17:08:12.047+05:30	\N
69fb2824e98c8a5737e82dd9	{"_id": "69fb2824e98c8a5737e82dd9", "body": "hello", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "chat_message", "title": "New chat message", "userId": "69faa5134e1d6b9cb1e2c752", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:38:12.095Z"}	\N	\N	69faa5134e1d6b9cb1e2c752	\N	\N	2026-05-06 17:08:12.095+05:30	\N
69fb284ce98c8a5737e82ddb	{"_id": "69fb284ce98c8a5737e82ddb", "body": "Your project manager has marked the booking as completed.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "booking_completed", "title": "Booking completed", "userId": "69faa5134e1d6b9cb1e2c756", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:38:52.757Z"}	\N	\N	69faa5134e1d6b9cb1e2c756	\N	\N	2026-05-06 17:08:52.757+05:30	\N
69fb284ce98c8a5737e82ddc	{"_id": "69fb284ce98c8a5737e82ddc", "body": "Booking 37e82dc4 marked complete by PM.", "data": {"bookingId": "69fb2756e98c8a5737e82dc4"}, "read": false, "type": "booking_completed", "title": "Booking completed", "userId": "69faa5134e1d6b9cb1e2c750", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:38:52.804Z"}	\N	\N	69faa5134e1d6b9cb1e2c750	\N	\N	2026-05-06 17:08:52.804+05:30	\N
69fb2912e98c8a5737e82de2	{"_id": "69fb2912e98c8a5737e82de2", "body": "hello", "data": {"ticketId": "69fae89c75ed7035320450d8"}, "read": false, "type": "ticket_message", "title": "Support replied", "userId": "69faa5134e1d6b9cb1e2c755", "channels": ["in_app", "push"], "createdAt": "2026-05-06T11:42:10.908Z"}	\N	\N	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 17:12:10.908+05:30	\N
69fb3412e98c8a5737e82dea	{"_id": "69fb3412e98c8a5737e82dea", "body": "Booking 37e82de8 paid. Auto-assigned to Priya Sharma.", "data": {"pmId": "69faa5134e1d6b9cb1e2c751", "bookingId": "69fb3410e98c8a5737e82de8"}, "read": false, "type": "booking_paid", "title": "Booking paid & PM assigned", "userId": "69faa5134e1d6b9cb1e2c750", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:29:06.737Z"}	\N	\N	69faa5134e1d6b9cb1e2c750	\N	\N	2026-05-06 17:59:06.737+05:30	\N
69fb3412e98c8a5737e82de9	{"_id": "69fb3412e98c8a5737e82de9", "body": "You have been assigned booking 37e82de8. Please start the work when ready.", "data": {"bookingId": "69fb3410e98c8a5737e82de8"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:29:06.737Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 17:59:06.737+05:30	\N
69fb3412e98c8a5737e82deb	{"_id": "69fb3412e98c8a5737e82deb", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69fb3410e98c8a5737e82de8"}, "read": true, "type": "booking_assigned", "title": "Project Manager assigned", "readAt": "2026-05-06T17:02:00.300Z", "userId": "69fb33f44e1d6b9cb1e2c930", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:29:06.737Z"}	\N	\N	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 17:59:06.737+05:30	\N
69fb37bfe98c8a5737e82df6	{"_id": "69fb37bfe98c8a5737e82df6", "body": "You have been assigned booking 37e82de8.", "data": {"bookingId": "69fb3410e98c8a5737e82de8"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:44:47.548Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 18:14:47.548+05:30	\N
69fb37bfe98c8a5737e82df7	{"_id": "69fb37bfe98c8a5737e82df7", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69fb3410e98c8a5737e82de8"}, "read": true, "type": "booking_assigned", "title": "Project Manager assigned", "readAt": "2026-05-06T17:02:00.300Z", "userId": "69fb33f44e1d6b9cb1e2c930", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:44:47.597Z"}	\N	\N	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 18:14:47.597+05:30	\N
69fb37cee98c8a5737e82df9	{"_id": "69fb37cee98c8a5737e82df9", "body": "You have been assigned to booking 37e82de8.", "data": {"bookingId": "69fb3410e98c8a5737e82de8"}, "read": false, "type": "assignment", "title": "New assignment", "userId": "69faa5134e1d6b9cb1e2c752", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:45:02.967Z"}	\N	\N	69faa5134e1d6b9cb1e2c752	\N	\N	2026-05-06 18:15:02.967+05:30	\N
69fb3905e98c8a5737e82dfe	{"_id": "69fb3905e98c8a5737e82dfe", "body": "You have been assigned booking 37e82dfb.", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": false, "type": "booking_assigned", "title": "New booking assigned", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:50:13.465Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 18:20:13.465+05:30	\N
69fb3905e98c8a5737e82dff	{"_id": "69fb3905e98c8a5737e82dff", "body": "Priya Sharma has been assigned to your booking.", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": true, "type": "booking_assigned", "title": "Project Manager assigned", "readAt": "2026-05-06T17:02:00.300Z", "userId": "69fb33f44e1d6b9cb1e2c930", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:50:13.465Z"}	\N	\N	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 18:20:13.465+05:30	\N
69fb3931e98c8a5737e82e03	{"_id": "69fb3931e98c8a5737e82e03", "body": "jdhs", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": true, "type": "chat_message", "title": "Admin message", "readAt": "2026-05-06T17:02:00.300Z", "userId": "69fb33f44e1d6b9cb1e2c930", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:50:57.512Z"}	\N	\N	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 18:20:57.512+05:30	\N
69fb3931e98c8a5737e82e04	{"_id": "69fb3931e98c8a5737e82e04", "body": "jdhs", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:50:57.561Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 18:20:57.561+05:30	\N
69fb3949e98c8a5737e82e08	{"_id": "69fb3949e98c8a5737e82e08", "body": "scdjhgv", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": true, "type": "chat_message", "title": "Admin message", "readAt": "2026-05-06T17:02:00.300Z", "userId": "69fb33f44e1d6b9cb1e2c930", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:51:21.526Z"}	\N	\N	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 18:21:21.526+05:30	\N
69fb3949e98c8a5737e82e09	{"_id": "69fb3949e98c8a5737e82e09", "body": "scdjhgv", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:51:21.575Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 18:21:21.575+05:30	\N
69fb3993e98c8a5737e82e11	{"_id": "69fb3993e98c8a5737e82e11", "body": "You have been assigned to booking 37e82dfb.", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": false, "type": "assignment", "title": "New assignment", "userId": "69fb3985e98c8a5737e82e0e", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:52:35.095Z"}	\N	\N	69fb3985e98c8a5737e82e0e	\N	\N	2026-05-06 18:22:35.095+05:30	\N
69fb39b6e98c8a5737e82e14	{"_id": "69fb39b6e98c8a5737e82e14", "body": "sakhjgxshagjk", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": true, "type": "chat_message", "title": "Admin message", "readAt": "2026-05-06T17:02:00.300Z", "userId": "69fb33f44e1d6b9cb1e2c930", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:53:10.392Z"}	\N	\N	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 18:23:10.392+05:30	\N
69fb39b6e98c8a5737e82e15	{"_id": "69fb39b6e98c8a5737e82e15", "body": "sakhjgxshagjk", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69faa5134e1d6b9cb1e2c751", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:53:10.465Z"}	\N	\N	69faa5134e1d6b9cb1e2c751	\N	\N	2026-05-06 18:23:10.465+05:30	\N
69fb39b6e98c8a5737e82e16	{"_id": "69fb39b6e98c8a5737e82e16", "body": "sakhjgxshagjk", "data": {"bookingId": "69fb384be98c8a5737e82dfb"}, "read": false, "type": "chat_message", "title": "Admin message", "userId": "69fb3985e98c8a5737e82e0e", "channels": ["in_app", "push"], "createdAt": "2026-05-06T12:53:10.465Z"}	\N	\N	69fb3985e98c8a5737e82e0e	\N	\N	2026-05-06 18:23:10.465+05:30	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5144e1d6b9cb1e2c76d	{"_id": "69faa5144e1d6b9cb1e2c76d", "amount": 7552, "method": "upi", "status": "captured", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "orderId": "order_test_001", "currency": "INR", "provider": "razorpay", "bookingId": "69faa51424729f95617814de", "createdAt": "2026-05-06T02:18:56.927Z", "paymentId": "pay_test_001", "updatedAt": "2026-05-06T14:08:44.248Z", "capturedAt": "2026-04-24T02:19:00.909Z"}	IN	captured	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 19:38:44.248+05:30
69faa5144e1d6b9cb1e2c76e	{"_id": "69faa5144e1d6b9cb1e2c76e", "amount": 13216, "method": "card", "status": "captured", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "orderId": "order_test_002", "currency": "INR", "provider": "razorpay", "bookingId": "69faa51424729f95617814df", "createdAt": "2026-05-06T02:18:56.927Z", "paymentId": "pay_test_002", "updatedAt": "2026-05-06T14:08:44.312Z", "capturedAt": "2026-05-03T02:19:00.937Z"}	IN	captured	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 19:38:44.312+05:30
69faa6a6d86bfbc6283aaada	{"_id": "69faa6a6d86bfbc6283aaada", "mock": true, "jobId": "69faa6a5d86bfbc6283aaad9", "amount": 8968, "status": "created", "userId": "69faa69b4e1d6b9cb1e2c7a0", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 1368, "inclusive": true}, "total": 8968, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 8968, "amountAfterDiscount": 8968}, "orderId": "order_fallback_1778034342919_7j3zxn", "currency": "INR", "provider": "mock", "bookingId": null, "createdAt": "2026-05-06T02:25:42.919Z", "paymentId": "pay_fallback_1778034342919", "updatedAt": "2026-05-06T02:25:42.919Z"}	IN	created	69faa69b4e1d6b9cb1e2c7a0	\N	\N	2026-05-06 07:55:42.919+05:30	2026-05-06 07:55:42.919+05:30
69facc5731bca016f25fe46b	{"_id": "69facc5731bca016f25fe46b", "mock": true, "jobId": "69facc5531bca016f25fe46a", "amount": 3776, "status": "created", "userId": "69faa69b4e1d6b9cb1e2c7a0", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 576, "inclusive": true}, "total": 3776, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 3776, "amountAfterDiscount": 3776}, "orderId": "order_fallback_1778043991126_5vc48u", "currency": "INR", "provider": "mock", "bookingId": null, "createdAt": "2026-05-06T05:06:31.126Z", "paymentId": "pay_fallback_1778043991126", "updatedAt": "2026-05-06T05:06:31.126Z"}	IN	created	69faa69b4e1d6b9cb1e2c7a0	\N	\N	2026-05-06 10:36:31.126+05:30	2026-05-06 10:36:31.126+05:30
69fada79e8408cd6d70ee6b1	{"_id": "69fada79e8408cd6d70ee6b1", "mock": false, "jobId": "69fada78e8408cd6d70ee6b0", "amount": 8968, "status": "created", "userId": "69fada674e1d6b9cb1e2c7d8", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 1368, "inclusive": true}, "total": 8968, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 8968, "amountAfterDiscount": 8968}, "orderId": "order_SlyQUIRDUiRoYt", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T06:06:49.719Z", "paymentId": null, "updatedAt": "2026-05-06T06:06:49.719Z"}	IN	created	69fada674e1d6b9cb1e2c7d8	\N	\N	2026-05-06 11:36:49.719+05:30	2026-05-06 11:36:49.719+05:30
69faea004e1d6b9cb1e2c824	{"_id": "69faea004e1d6b9cb1e2c824", "mock": false, "jobId": "69fae776295d34e9cc656485", "amount": 4248, "status": "created", "userId": "69fae9dc4e1d6b9cb1e2c823", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 648, "inclusive": true}, "total": 4248, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 4248, "amountAfterDiscount": 4248}, "orderId": "order_SlzYSqgPsnOvGy", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T07:13:04.601Z", "updatedAt": "2026-05-06T07:13:04.601Z"}	IN	created	69fae9dc4e1d6b9cb1e2c823	\N	\N	2026-05-06 12:43:04.601+05:30	2026-05-06 12:43:04.601+05:30
69faea304e1d6b9cb1e2c826	{"_id": "69faea304e1d6b9cb1e2c826", "mock": false, "jobId": "69fae776295d34e9cc656485", "amount": 4248, "status": "created", "userId": "69fae9dc4e1d6b9cb1e2c823", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 648, "inclusive": true}, "total": 4248, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 4248, "amountAfterDiscount": 4248}, "orderId": "order_SlzZIz3sVKbHMs", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T07:13:52.191Z", "updatedAt": "2026-05-06T07:13:52.191Z"}	IN	created	69fae9dc4e1d6b9cb1e2c823	\N	\N	2026-05-06 12:43:52.191+05:30	2026-05-06 12:43:52.191+05:30
69faea814e1d6b9cb1e2c82b	{"_id": "69faea814e1d6b9cb1e2c82b", "mock": false, "jobId": "69fae776295d34e9cc656485", "amount": 4248, "status": "created", "userId": "69fae9dc4e1d6b9cb1e2c823", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 648, "inclusive": true}, "total": 4248, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 4248, "amountAfterDiscount": 4248}, "orderId": "order_Slzak9mrz3UCpY", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T07:15:13.883Z", "updatedAt": "2026-05-06T07:15:13.883Z"}	IN	created	69fae9dc4e1d6b9cb1e2c823	\N	\N	2026-05-06 12:45:13.883+05:30	2026-05-06 12:45:13.883+05:30
69faeaec4e1d6b9cb1e2c82c	{"_id": "69faeaec4e1d6b9cb1e2c82c", "mock": false, "jobId": "69faeaeb86202e843ee0da5c", "amount": 1000, "status": "created", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 153, "inclusive": true}, "total": 1000, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 1000, "amountAfterDiscount": 1000}, "orderId": "order_Slzcd1nODOH8Tj", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T07:17:00.953Z", "updatedAt": "2026-05-06T07:17:00.953Z"}	IN	created	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 12:47:00.953+05:30	2026-05-06 12:47:00.953+05:30
69faebe04e1d6b9cb1e2c82f	{"_id": "69faebe04e1d6b9cb1e2c82f", "mock": false, "jobId": "69faebe0e98c8a5737e82d9c", "amount": 8968, "status": "created", "userId": "69faebd14e1d6b9cb1e2c82d", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 1368, "inclusive": true}, "total": 8968, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 8968, "amountAfterDiscount": 8968}, "orderId": "order_SlzgvQTHnW7og9", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T07:21:04.991Z", "updatedAt": "2026-05-06T07:21:04.991Z"}	IN	created	69faebd14e1d6b9cb1e2c82d	\N	\N	2026-05-06 12:51:04.991+05:30	2026-05-06 12:51:04.991+05:30
69fb13004e1d6b9cb1e2c8e7	{"_id": "69fb13004e1d6b9cb1e2c8e7", "mock": false, "jobId": "69fb12ffe98c8a5737e82db5", "amount": 14160, "status": "created", "userId": "69fb12f84e1d6b9cb1e2c8e6", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 2160, "inclusive": true}, "total": 14160, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 14160, "amountAfterDiscount": 14160}, "orderId": "order_Sm2XFlT3TAQFLD", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T10:08:00.478Z", "updatedAt": "2026-05-06T10:08:00.478Z"}	IN	created	69fb12f84e1d6b9cb1e2c8e6	\N	\N	2026-05-06 15:38:00.478+05:30	2026-05-06 15:38:00.478+05:30
69fb27574e1d6b9cb1e2c90b	{"_id": "69fb27574e1d6b9cb1e2c90b", "mock": false, "jobId": "69fb2756e98c8a5737e82dc4", "amount": 7080, "status": "created", "userId": "69faa5134e1d6b9cb1e2c756", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 1080, "inclusive": true}, "total": 7080, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 7080, "amountAfterDiscount": 7080}, "orderId": "order_Sm40v9vW90fWmI", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T11:34:47.224Z", "updatedAt": "2026-05-06T11:34:47.224Z"}	IN	created	69faa5134e1d6b9cb1e2c756	\N	\N	2026-05-06 17:04:47.224+05:30	2026-05-06 17:04:47.224+05:30
69fb34124e1d6b9cb1e2c931	{"_id": "69fb34124e1d6b9cb1e2c931", "mock": true, "jobId": "69fb3410e98c8a5737e82de8", "amount": 271891, "status": "created", "userId": "69fb33f44e1d6b9cb1e2c930", "country": "DE", "invoice": {"tax": {"name": "MwSt.", "rate": 0.19, "type": "vat", "amount": 43411, "inclusive": false}, "total": 271891, "locale": "de-DE", "currency": "EUR", "discount": 0, "subtotal": 228480, "amountAfterDiscount": 228480}, "orderId": "order_fallback_1778070546419_4bg7cw", "currency": "EUR", "provider": "mock", "bookingId": null, "createdAt": "2026-05-06T12:29:06.419Z", "paymentId": "pay_fallback_1778070546419", "updatedAt": "2026-05-06T12:29:06.419Z"}	DE	created	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 17:59:06.419+05:30	2026-05-06 17:59:06.419+05:30
69fb344f4e1d6b9cb1e2c932	{"_id": "69fb344f4e1d6b9cb1e2c932", "mock": false, "jobId": "69fb3444e98c8a5737e82dec", "amount": 62.36, "status": "created", "userId": "69fb33f44e1d6b9cb1e2c930", "country": "DE", "invoice": {"tax": {"name": "MwSt.", "rate": 0.19, "type": "vat", "amount": 10, "inclusive": false}, "total": 62.36, "locale": "de-DE", "currency": "EUR", "discount": 0, "subtotal": 52.36, "amountAfterDiscount": 52.36}, "orderId": "order_Sm4xNQorOZn9Wc", "currency": "EUR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T12:30:07.525Z", "updatedAt": "2026-05-06T12:30:07.526Z"}	DE	created	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 18:00:07.525+05:30	2026-05-06 18:00:07.526+05:30
69fb384c4e1d6b9cb1e2c942	{"_id": "69fb384c4e1d6b9cb1e2c942", "mock": false, "jobId": "69fb384be98c8a5737e82dfb", "amount": 7080, "status": "created", "userId": "69fb33f44e1d6b9cb1e2c930", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 1080, "inclusive": true}, "total": 7080, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 7080, "amountAfterDiscount": 7080}, "orderId": "order_Sm5FLfNam7mX8D", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T12:47:08.312Z", "updatedAt": "2026-05-06T12:47:08.312Z"}	IN	created	69fb33f44e1d6b9cb1e2c930	\N	\N	2026-05-06 18:17:08.312+05:30	2026-05-06 18:17:08.312+05:30
69fb550a2b307b985b3cbcc0	{"_id": "69fb550a2b307b985b3cbcc0", "mock": false, "jobId": "69fb5508ed817c143dc9bf44", "amount": 1000, "status": "created", "userId": "69faa5134e1d6b9cb1e2c755", "country": "IN", "invoice": {"tax": {"name": "GST", "rate": 0.18, "type": "gst", "amount": 153, "inclusive": true}, "total": 1000, "locale": "en-IN", "currency": "INR", "discount": 0, "subtotal": 1000, "amountAfterDiscount": 1000}, "orderId": "order_Sm7KsvWMqcu4MW", "currency": "INR", "provider": "razorpay", "bookingId": null, "createdAt": "2026-05-06T14:49:46.040Z", "updatedAt": "2026-05-06T14:49:46.040Z"}	IN	created	69faa5134e1d6b9cb1e2c755	\N	\N	2026-05-06 20:19:46.04+05:30	2026-05-06 20:19:46.04+05:30
\.


--
-- Data for Name: payouts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payouts (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_codes (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5164e1d6b9cb1e2c789	{"_id": "69faa5164e1d6b9cb1e2c789", "code": "WELCOME200", "type": "flat_off", "value": 200, "active": true, "minCart": 1000, "createdAt": "2026-05-06T02:18:56.927Z", "createdBy": "69faa5134e1d6b9cb1e2c750", "updatedAt": "2026-05-06T07:07:01.458Z", "validFrom": "2026-04-06T02:19:02.073Z", "usageCount": 0, "usageLimit": 1000, "validUntil": "2026-08-04T02:19:02.073Z", "description": "₹200 off on first booking", "perUserLimit": 1}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c78a	{"_id": "69faa5164e1d6b9cb1e2c78a", "code": "QHDEV10", "type": "pct_off", "value": 10, "active": true, "minCart": 2000, "createdAt": "2026-05-06T02:18:56.927Z", "createdBy": "69faa5134e1d6b9cb1e2c750", "updatedAt": "2026-05-06T07:07:01.458Z", "validFrom": "2026-04-06T02:19:02.103Z", "usageCount": 0, "usageLimit": 500, "validUntil": "2026-08-04T02:19:02.103Z", "description": "10% off on developer services", "perUserLimit": 3}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c78b	{"_id": "69faa5164e1d6b9cb1e2c78b", "code": "AILAUNCH", "type": "pct_off", "value": 15, "active": true, "minCart": 3000, "createdAt": "2026-05-06T02:18:56.927Z", "createdBy": "69faa5134e1d6b9cb1e2c750", "updatedAt": "2026-05-06T07:07:01.458Z", "validFrom": "2026-04-06T02:19:02.132Z", "usageCount": 0, "usageLimit": 200, "validUntil": "2026-08-04T02:19:02.132Z", "description": "15% off on AI/ML bookings", "perUserLimit": 1}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c78c	{"_id": "69faa5164e1d6b9cb1e2c78c", "code": "DEVOPS50", "type": "flat_off", "value": 500, "active": true, "minCart": 4000, "createdAt": "2026-05-06T02:18:56.927Z", "createdBy": "69faa5134e1d6b9cb1e2c750", "updatedAt": "2026-05-06T07:07:01.458Z", "validFrom": "2026-04-06T02:19:02.162Z", "usageCount": 0, "usageLimit": 100, "validUntil": "2026-08-04T02:19:02.162Z", "description": "₹500 off DevOps bookings", "perUserLimit": 2}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
\.


--
-- Data for Name: promo_redemptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_redemptions (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refunds (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reschedule_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reschedule_history (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: resource_deliverables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_deliverables (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: resource_time_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_time_logs (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: resource_work_updates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_work_updates (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5154e1d6b9cb1e2c76f	{"_id": "69faa5154e1d6b9cb1e2c76f", "toId": "69faa5134e1d6b9cb1e2c752", "fromId": "69faa5134e1d6b9cb1e2c755", "rating": 5, "comment": "Arjun was exceptional — delivered clean, well-documented React code on time.", "bookingId": "69faa51424729f95617814de", "createdAt": "2026-05-06T02:18:56.927Z", "serviceId": null, "updatedAt": "2026-05-06T02:18:56.927Z", "moderationStatus": "approved"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 07:48:56.927+05:30
69fae89a4e1d6b9cb1e2c81a	{"_id": "69fae89a4e1d6b9cb1e2c81a", "toId": "69faa5134e1d6b9cb1e2c752", "fromId": "69faa5134e1d6b9cb1e2c755", "rating": 5, "comment": "Arjun was exceptional — delivered clean, well-documented React code on time.", "bookingId": "69fae89975ed7035320450d0", "createdAt": "2026-05-06T07:07:01.458Z", "serviceId": null, "updatedAt": "2026-05-06T07:07:01.458Z", "moderationStatus": "approved"}	\N	\N	\N	\N	\N	2026-05-06 12:37:01.458+05:30	2026-05-06 12:37:01.458+05:30
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (_id, slug, name, tagline, description, category, category_name, technologies, pricing, highlights, inclusions, not_included, faq, hourly_rate, currency, min_hours, max_hours, image, icon_url, sort_order, active, created_at, updated_at) FROM stdin;
69fb01ae46a7a8a8c7b31773	frontend-development	{"ar": "تطوير الواجهة الأمامية", "de": "Frontend-Entwicklung", "en": "Frontend Development", "hi": "फ्रंटएंड डेवलपमेंट"}	{"ar": "تطبيقات ويب حديثة سريعة وقابلة للوصول وآمنة الأنواع.", "de": "Schnelle, barrierefreie, typsichere moderne Web-Apps.", "en": "Fast, accessible, type-safe modern web apps.", "hi": "फ़ास्ट, एक्सेसिबल, टाइप-सेफ मॉडर्न वेब ऐप्स।"}	{"ar": "تطبيقات SPA و PWA و SSR/SSG في React و Next.js و Vue أو Angular — مع التركيز على Core Web Vitals وإمكانية الوصول WCAG وإعادة استخدام نظام التصميم.", "de": "SPA-, PWA- und SSR/SSG-Builds in React, Next.js, Vue oder Angular — mit Fokus auf Core Web Vitals, WCAG und Design-System-Reuse.", "en": "SPA, PWA and SSR/SSG builds in React, Next.js, Vue or Angular — focused on Core Web Vitals, WCAG accessibility and design-system reuse.", "hi": "React, Next.js, Vue या Angular में SPA, PWA और SSR/SSG बिल्ड्स — Core Web Vitals, WCAG एक्सेसिबिलिटी और डिज़ाइन-सिस्टम रीयूज़ पर फ़ोकस।"}	engineering	{"ar": "الهندسة", "de": "Engineering", "en": "Engineering", "hi": "इंजीनियरिंग"}	[{"name": {"ar": "تطوير React.js", "de": "React.js-Entwicklung", "en": "React.js Development", "hi": "React.js डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير Next.js", "de": "Next.js-Entwicklung", "en": "Next.js Development", "hi": "Next.js डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير Vue.js", "de": "Vue.js-Entwicklung", "en": "Vue.js Development", "hi": "Vue.js डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير Angular", "de": "Angular-Entwicklung", "en": "Angular Development", "hi": "Angular डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطبيقات الصفحة الواحدة (SPA)", "de": "Single-Page-Applications (SPA)", "en": "Single Page Applications (SPA)", "hi": "सिंगल पेज ऐप्लिकेशन (SPA)"}, "required": false}, {"name": {"ar": "تطبيقات الويب التقدمية (PWA)", "de": "Progressive Web Apps (PWA)", "en": "Progressive Web Apps (PWA)", "hi": "प्रोग्रेसिव वेब ऐप्स (PWA)"}, "required": false}, {"name": {"ar": "تحسين أداء الويب", "de": "Web-Performance-Optimierung", "en": "Web Performance Optimization", "hi": "वेब परफॉरमेंस ऑप्टिमाइज़ेशन"}, "required": false}, {"name": {"ar": "تطوير WordPress", "de": "WordPress-Entwicklung", "en": "WordPress Development", "hi": "WordPress डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير Magento", "de": "Magento-Entwicklung", "en": "Magento Development", "hi": "Magento डेवलपमेंट"}, "required": false}, {"name": {"ar": "الامتثال للوصول (WCAG)", "de": "Barrierefreiheit (WCAG)", "en": "Accessibility Compliance (WCAG)", "hi": "एक्सेसिबिलिटी कम्प्लायंस (WCAG)"}, "required": false}, {"name": {"ar": "تطوير مكتبة المكونات", "de": "Komponenten-Bibliotheks-Entwicklung", "en": "Component Library Development", "hi": "कंपोनेंट लाइब्रेरी डेवलपमेंट"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1200, "minCharge": 1200, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 50, "minCharge": 50, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 13, "minCharge": 13, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 22, "minCharge": 22, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 14, "minCharge": 14, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[{"ar": "نقاط Core Web Vitals 90+", "de": "Core Web Vitals Score 90+", "en": "Core Web Vitals score 90+", "hi": "Core Web Vitals स्कोर 90+"}, {"ar": "إمكانية الوصول WCAG 2.1 AA", "de": "WCAG 2.1 AA Barrierefreiheit", "en": "WCAG 2.1 AA accessibility", "hi": "WCAG 2.1 AA एक्सेसिबिलिटी"}, {"ar": "TypeScript أولاً", "de": "TypeScript-first", "en": "TypeScript-first", "hi": "TypeScript-फ़र्स्ट"}, {"ar": "مكتبة مكونات قابلة لإعادة الاستخدام", "de": "Wiederverwendbare Komponenten-Bibliothek", "en": "Reusable component library", "hi": "रीयूज़ेबल कंपोनेंट लाइब्रेरी"}]	[{"ar": "تنفيذ واجهة المستخدم من التصاميم", "de": "UI-Umsetzung aus Designs", "en": "UI implementation from designs", "hi": "डिज़ाइन से UI इम्प्लीमेंटेशन"}, {"ar": "التوجيه وإدارة الحالة والنماذج", "de": "Routing, State-Management, Formulare", "en": "Routing, state management, forms", "hi": "राउटिंग, स्टेट मैनेजमेंट, फॉर्म्स"}, {"ar": "تكامل API", "de": "API-Integration", "en": "API integration", "hi": "API इंटीग्रेशन"}, {"ar": "تدقيق الأداء وإمكانية الوصول", "de": "Performance- und a11y-Audits", "en": "Performance and a11y audits", "hi": "परफॉरमेंस और a11y ऑडिट"}]	[{"ar": "تصميم / Wireframes UX", "de": "Design / UX-Wireframes", "en": "Design / UX wireframes", "hi": "डिज़ाइन / UX वायरफ्रेम"}, {"ar": "واجهات الخلفية", "de": "Backend-APIs", "en": "Backend APIs", "hi": "बैकएंड APIs"}]	[{"answer": {"ar": "نعم — Jest/Vitest وحدة، Playwright e2e، مع تكامل CI.", "de": "Ja — Jest/Vitest Unit, Playwright e2e, mit CI-Integration.", "en": "Yes — Jest/Vitest unit, Playwright e2e, with CI integration.", "hi": "हाँ — Jest/Vitest unit, Playwright e2e, CI integration के साथ।"}, "question": {"ar": "هل تكتبون اختبارات؟", "de": "Schreiben Sie Tests?", "en": "Do you write tests?", "hi": "क्या आप टेस्ट लिखते हैं?"}}]	1200	INR	1	24	https://placehold.co/600x400?text=Frontend%2BDevelopment	\N	3	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31774	ui-ux-designer	{"ar": "مصمم UI/UX", "de": "UI/UX-Designer", "en": "UI/UX Designer", "hi": "UI/UX डिज़ाइनर"}	{"ar": "تصميم منتج قائم على البحث ويحقق التحويل.", "de": "Forschungsgeleitetes Produktdesign, das konvertiert.", "en": "Research-led product design that converts.", "hi": "रिसर्च-लेड प्रोडक्ट डिज़ाइन जो कन्वर्ट करता है।"}	{"ar": "تصميم منتج شامل يغطي بحث المستخدم وWireframes والنماذج الأولية وأنظمة التصميم واختبار قابلية الاستخدام — للويب والجوال.", "de": "End-to-End-Produktdesign — User Research, Wireframes, Prototypen, Design-Systeme und Usability-Tests für Web und Mobile.", "en": "End-to-end product design covering user research, wireframes, prototypes, design systems and usability testing — for web and mobile.", "hi": "यूज़र रिसर्च, वायरफ्रेम, प्रोटोटाइप, डिज़ाइन सिस्टम और usability testing कवर करता एंड-टू-एंड प्रोडक्ट डिज़ाइन — वेब और मोबाइल के लिए।"}	design	{"ar": "التصميم", "de": "Design", "en": "Design", "hi": "डिज़ाइन"}	[{"name": {"ar": "كتاب الهوية", "de": "Brand Book", "en": "Brand Book", "hi": "ब्रैंड बुक"}, "required": false}, {"name": {"ar": "تصميم تطبيقات الجوال", "de": "Mobile-App-Design", "en": "Mobile App Design", "hi": "मोबाइल ऐप डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم صفحة الهبوط", "de": "Landingpage-Design", "en": "Landing Page Design", "hi": "लैंडिंग पेज डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم Wireframe", "de": "Wireframe-Design", "en": "Wireframe Design", "hi": "वायरफ्रेम डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم المواقع", "de": "Website-Design", "en": "Website Design", "hi": "वेबसाइट डिज़ाइन"}, "required": false}, {"name": {"ar": "التصميم الجرافيكي", "de": "Grafikdesign", "en": "Graphic Design", "hi": "ग्राफिक डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم النموذج الأولي", "de": "Prototyp-Design", "en": "Prototype Design", "hi": "प्रोटोटाइप डिज़ाइन"}, "required": false}, {"name": {"ar": "إنشاء نظام التصميم", "de": "Design-System-Erstellung", "en": "Design System Creation", "hi": "डिज़ाइन सिस्टम क्रिएशन"}, "required": false}, {"name": {"ar": "رسم رحلة المستخدم", "de": "User-Journey-Mapping", "en": "User Journey Mapping", "hi": "यूज़र जर्नी मैपिंग"}, "required": false}, {"name": {"ar": "UX يركز على التحويل", "de": "Conversion-fokussiertes UX", "en": "Conversion-Focused UX", "hi": "कन्वर्जन-फ़ोकस्ड UX"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1100, "minCharge": 1100, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 50, "minCharge": 50, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 12, "minCharge": 12, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 20, "minCharge": 20, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 13, "minCharge": 13, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[{"ar": "بحث المستخدم ورسم الرحلة", "de": "User Research und Journey Mapping", "en": "User research and journey mapping", "hi": "यूज़र रिसर्च और जर्नी मैपिंग"}, {"ar": "أنظمة تصميم Figma", "de": "Figma Design-Systeme", "en": "Figma design systems", "hi": "Figma डिज़ाइन सिस्टम"}, {"ar": "النماذج الأولية التفاعلية", "de": "Interaktive Prototypen", "en": "Interactive prototypes", "hi": "इंटरैक्टिव प्रोटोटाइप"}, {"ar": "UX يركز على التحويل", "de": "Conversion-fokussiertes UX", "en": "Conversion-focused UX", "hi": "कन्वर्ज़न-फ़ोकस्ड UX"}]	[{"ar": "استكشاف + تدقيق تنافسي", "de": "Discovery + Wettbewerbs-Audit", "en": "Discovery + competitive audit", "hi": "डिस्कवरी + कम्पटीटिव ऑडिट"}, {"ar": "Wireframes ونماذج عالية الدقة", "de": "Wireframes und Hi-Fi-Mockups", "en": "Wireframes and hi-fi mockups", "hi": "वायरफ्रेम और हाई-फ़ाई मॉकअप्स"}, {"ar": "نموذج أولي قابل للنقر", "de": "Klickbarer Prototyp", "en": "Clickable prototype", "hi": "क्लिकेबल प्रोटोटाइप"}, {"ar": "دليل النمط / رموز التصميم", "de": "Style Guide / Design Tokens", "en": "Style guide / design tokens", "hi": "स्टाइल गाइड / डिज़ाइन टोकन"}]	[{"ar": "تنفيذ الكود", "de": "Code-Umsetzung", "en": "Code implementation", "hi": "कोड इम्प्लीमेंटेशन"}, {"ar": "النسخة التسويقية", "de": "Marketing-Texte", "en": "Marketing copy", "hi": "मार्केटिंग कॉपी"}]	[{"answer": {"ar": "نعم — ملف Figma كامل بجميع المكونات ورموز التصميم.", "de": "Ja — vollständige Figma-Datei mit allen Komponenten und Design Tokens.", "en": "Yes — full Figma file with all components and design tokens.", "hi": "हाँ — सभी कंपोनेंट और डिज़ाइन टोकन के साथ पूरी Figma फ़ाइल।"}, "question": {"ar": "هل تقدمون ملفات المصدر؟", "de": "Stellen Sie Quelldateien bereit?", "en": "Do you provide source files?", "hi": "क्या आप सोर्स फाइलें देते हैं?"}}]	1100	INR	1	24	https://placehold.co/600x400?text=UI%2FUX%2BDesigner	\N	4	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b3177b	third-party-integration	{"ar": "تكامل الأطراف الثالثة", "de": "Drittanbieter-Integration", "en": "Third Party Integration", "hi": "थर्ड पार्टी इंटीग्रेशन"}	{"ar": "صل أي خدمة بمنظومتك.", "de": "Verbinden Sie jeden Service mit Ihrem Stack.", "en": "Connect any service into your stack.", "hi": "कोई भी सर्विस आपके स्टैक में कनेक्ट करें।"}	{"ar": "الدفع و SSO والخرائط والرسائل والبريد والدردشة والفيديو والتقاويم وCRM والمحاسبة والشحن والتذاكر — مع إعادة المحاولة و Webhooks وتتبع الأخطاء.", "de": "Zahlungen, SSO, Karten, SMS/E-Mail, Chat, Video, Kalender, CRM, Buchhaltung, Versand und Ticketing — produktionsreife Integrationen mit Retries, Webhooks und Error-Tracking.", "en": "Payments, SSO, maps, SMS/email, chat, video, calendars, CRM, accounting, shipping and ticketing — production integrations with retries, webhooks and error tracking.", "hi": "पेमेंट, SSO, मैप्स, SMS/ईमेल, चैट, वीडियो, कैलेंडर, CRM, अकाउंटिंग, शिपिंग और टिकटिंग — रिट्राइज़, वेबहुक्स और एरर ट्रैकिंग के साथ प्रोडक्शन इंटीग्रेशन।"}	integration	{"ar": "التكاملات", "de": "Integrationen", "en": "Integrations", "hi": "इंटीग्रेशन"}	[{"name": {"ar": "تكامل بوابات الدفع", "de": "Payment-Gateway-Integration", "en": "Payment Gateway Integration", "hi": "पेमेंट गेटवे इंटीग्रेशन"}, "required": false}, {"name": {"ar": "المصادقة الاجتماعية و SSO", "de": "Social Auth & SSO", "en": "Social Auth & SSO", "hi": "सोशल ऑथ और SSO"}, "required": false}, {"name": {"ar": "واجهات الخرائط والموقع الجغرافي", "de": "Map- & Geolocation-APIs", "en": "Map & Geolocation APIs", "hi": "मैप और जियो-लोकेशन APIs"}, "required": false}, {"name": {"ar": "تكامل خدمات SMS والبريد الإلكتروني", "de": "SMS- & E-Mail-Service-Integration", "en": "SMS & Email Service Integration", "hi": "SMS और ईमेल सर्विस इंटीग्रेशन"}, "required": false}, {"name": {"ar": "تكامل SDK الدردشة", "de": "Chat-SDK-Integration", "en": "Chat SDK Integration", "hi": "चैट SDK इंटीग्रेशन"}, "required": false}, {"name": {"ar": "التحليلات والإبلاغ عن الأعطال", "de": "Analytics & Crash-Reporting", "en": "Analytics & Crash Reporting", "hi": "एनालिटिक्स और क्रैश रिपोर्टिंग"}, "required": false}, {"name": {"ar": "مؤتمرات الفيديو والبث", "de": "Video-Conferencing & Streaming", "en": "Video Conferencing & Streaming", "hi": "वीडियो कॉन्फ्रेंसिंग और स्ट्रीमिंग"}, "required": false}, {"name": {"ar": "API التقويم والجدولة", "de": "Kalender- & Scheduling-API", "en": "Calendar & Scheduling API", "hi": "कैलेंडर और शेड्यूलिंग API"}, "required": false}, {"name": {"ar": "مزامنة نظام CRM", "de": "CRM-System-Synchronisation", "en": "CRM System Synchronization", "hi": "CRM सिस्टम सिंक्रोनाइज़ेशन"}, "required": false}, {"name": {"ar": "المحاسبة والفوترة", "de": "Buchhaltung & Rechnungsstellung", "en": "Accounting & Invoicing", "hi": "अकाउंटिंग और इनवॉइसिंग"}, "required": false}, {"name": {"ar": "الشحن والخدمات اللوجستية", "de": "Versand & Logistik", "en": "Shipping & Logistics", "hi": "शिपिंग और लॉजिस्टिक्स"}, "required": false}, {"name": {"ar": "الأسواق والتجارة الإلكترونية", "de": "Marketplace & E-Commerce", "en": "Marketplace & E-commerce", "hi": "मार्केटप्लेस और ई-कॉमर्स"}, "required": false}, {"name": {"ar": "تذاكر دعم العملاء", "de": "Kundensupport-Ticketing", "en": "Customer Support Ticketing", "hi": "कस्टमर सपोर्ट टिकटिंग"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1250, "minCharge": 1250, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 55, "minCharge": 55, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 14, "minCharge": 14, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 23, "minCharge": 23, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 15, "minCharge": 15, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1250	INR	1	24	https://placehold.co/600x400?text=Third%2BParty%2BIntegration	\N	11	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31781	it-services	{"ar": "خدمات تقنية المعلومات", "de": "IT-Dienstleistungen", "en": "IT Services", "hi": "IT सर्विसेज़"}	{"ar": "عمليات IT مُدارة شاملة.", "de": "End-to-End Managed IT.", "en": "End-to-end managed IT operations.", "hi": "एंड-टू-एंड मैनेज्ड IT ऑपरेशन्स।"}	{"ar": "IT مُدارة — إدارة السيرفر و RMM والشبكات والاستضافة والنسخ الاحتياطي وتخطيط DR وترحيل الأنظمة ومراقبة الصحة المستمرة.", "de": "Managed IT — Serveradministration, RMM, Networking, Hosting, Backups, DR-Planung, Systemmigration und kontinuierliches Health-Monitoring.", "en": "Managed IT — server admin, RMM, networking, hosting, backups, DR planning, system migrations and continuous health monitoring.", "hi": "मैनेज्ड IT — सर्वर एडमिन, RMM, नेटवर्किंग, होस्टिंग, बैकअप, DR प्लानिंग, सिस्टम माइग्रेशन और कंटिन्यूअस हेल्थ मॉनिटरिंग।"}	it-services	{"ar": "خدمات تقنية المعلومات", "de": "IT-Services", "en": "IT Services", "hi": "IT सर्विसेज़"}	[{"name": {"ar": "إدارة السيرفر", "de": "Serveradministration", "en": "Server Administration", "hi": "सर्वर एडमिनिस्ट्रेशन"}, "required": false}, {"name": {"ar": "مكتب مساعدة 24/7 (L1/L2/L3)", "de": "24/7-Helpdesk (L1/L2/L3)", "en": "24/7 Help Desk (L1/L2/L3)", "hi": "24/7 हेल्प डेस्क (L1/L2/L3)"}, "required": false}, {"name": {"ar": "المراقبة والإدارة عن بعد (RMM)", "de": "Remote Monitoring & Management (RMM)", "en": "Remote Monitoring & Management (RMM)", "hi": "रिमोट मॉनिटरिंग और मैनेजमेंट (RMM)"}, "required": false}, {"name": {"ar": "إعداد VPN وجدار الحماية", "de": "VPN- & Firewall-Einrichtung", "en": "VPN & Firewall Setup", "hi": "VPN और फ़ायरवॉल सेटअप"}, "required": false}, {"name": {"ar": "الترحيل والدعم السحابي", "de": "Cloud-Migration & Support", "en": "Cloud Migration & Support", "hi": "क्लाउड माइग्रेशन और सपोर्ट"}, "required": false}, {"name": {"ar": "إدارة الشبكة", "de": "Netzwerkadministration", "en": "Network Administration", "hi": "नेटवर्क एडमिनिस्ट्रेशन"}, "required": false}, {"name": {"ar": "إدارة النسخ الاحتياطي والاستعادة", "de": "Backup- & Restore-Management", "en": "Backup & Restore Management", "hi": "बैकअप और रिस्टोर मैनेजमेंट"}, "required": false}, {"name": {"ar": "تخطيط التعافي من الكوارث", "de": "Disaster-Recovery-Planung", "en": "Disaster Recovery Planning", "hi": "डिज़ास्टर रिकवरी प्लानिंग"}, "required": false}, {"name": {"ar": "إدارة الاستضافة والسيرفر", "de": "Hosting- & Server-Management", "en": "Hosting & Server Management", "hi": "होस्टिंग और सर्वर मैनेजमेंट"}, "required": false}, {"name": {"ar": "ترحيل وترقية الأنظمة", "de": "Systemmigration & Upgrades", "en": "System Migration & Upgrades", "hi": "सिस्टम माइग्रेशन और अपग्रेड"}, "required": false}, {"name": {"ar": "مراقبة الأداء والصحة", "de": "Performance- & Health-Monitoring", "en": "Performance & Health Monitoring", "hi": "परफॉरमेंस और हेल्थ मॉनिटरिंग"}, "required": false}, {"name": {"ar": "دعم النشر السحابي", "de": "Cloud-Deployment-Support", "en": "Cloud Deployment Support", "hi": "क्लाउड डिप्लॉयमेंट सपोर्ट"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1050, "minCharge": 1050, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 45, "minCharge": 45, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 12, "minCharge": 12, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 19, "minCharge": 19, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 13, "minCharge": 13, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1050	INR	1	24	https://placehold.co/600x400?text=IT%2BServices	\N	17	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b3177d	gen-ai-development	{"ar": "تطوير الذكاء الاصطناعي التوليدي", "de": "Gen AI-Entwicklung", "en": "Gen AI Development", "hi": "Gen AI डेवलपमेंट"}	{"ar": "تكاملات مخصصة GPT/Claude/Gemini و RAG.", "de": "Custom GPT/Claude/Gemini-Integrationen und RAG.", "en": "Custom GPT/Claude/Gemini integrations and RAG.", "hi": "कस्टम GPT/Claude/Gemini इंटीग्रेशन और RAG।"}	{"ar": "ميزات Gen-AI جاهزة للإنتاج — روبوتات دردشة وبحث RAG وقواعد بيانات Vector وضبط دقيق وتكامل سلس في منتجك الحالي.", "de": "Produktionsreife Gen-AI-Features — Chatbots, RAG-Suche, Vektor-DBs, Fine-Tuning und nahtlose Integration in Ihr Produkt.", "en": "Production-ready Gen-AI features — chatbots, RAG search, vector DBs, fine-tuning and seamless integration into your existing product.", "hi": "प्रोडक्शन-रेडी Gen-AI फ़ीचर्स — चैटबॉट्स, RAG search, वेक्टर DB, fine-tuning और आपके मौजूदा प्रोडक्ट में सहज इंटीग्रेशन।"}	ai	{"ar": "الذكاء الاصطناعي والتعلم الآلي", "de": "KI & Machine Learning", "en": "AI & Machine Learning", "hi": "AI और मशीन लर्निंग"}	[{"name": {"ar": "روبوتات الدردشة (دعم العملاء، الأدوات الداخلية)", "de": "KI-Chatbots (Kundensupport, interne Tools)", "en": "AI Chatbots (Customer Support, Internal Tools)", "hi": "AI चैटबॉट (कस्टमर सपोर्ट, इंटरनल टूल्स)"}, "required": false}, {"name": {"ar": "تكامل LLM (OpenAI, Gemini, Claude)", "de": "LLM-Integration (OpenAI, Gemini, Claude)", "en": "LLM Integration (OpenAI, Gemini, Claude)", "hi": "LLM इंटीग्रेशन (OpenAI, Gemini, Claude)"}, "required": false}, {"name": {"ar": "هندسة الموجهات", "de": "Prompt Engineering", "en": "Prompt Engineering", "hi": "प्रॉम्प्ट इंजीनियरिंग"}, "required": false}, {"name": {"ar": "التحليلات التنبؤية", "de": "Predictive Analytics", "en": "Predictive Analytics", "hi": "प्रिडिक्टिव एनालिटिक्स"}, "required": false}, {"name": {"ar": "أنظمة RAG (التوليد المعزز بالاسترجاع)", "de": "Retrieval-Augmented Generation (RAG)", "en": "Retrieval-Augmented Generation (RAG) Systems", "hi": "रिट्रीवल-ऑगमेंटेड जनरेशन (RAG) सिस्टम"}, "required": false}, {"name": {"ar": "حلول الرؤية الحاسوبية", "de": "Computer-Vision-Lösungen", "en": "Computer Vision Solutions", "hi": "कंप्यूटर विज़न सॉल्यूशंस"}, "required": false}, {"name": {"ar": "معالجة اللغة الطبيعية (NLP)", "de": "Natural Language Processing (NLP)", "en": "Natural Language Processing (NLP)", "hi": "नेचुरल लैंग्वेज प्रोसेसिंग (NLP)"}, "required": false}, {"name": {"ar": "تطوير قاعدة بيانات Vector", "de": "Vector-Datenbank-Entwicklung", "en": "Vector Database Development", "hi": "वेक्टर डेटाबेस डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير نماذج التعلم الآلي", "de": "Machine-Learning-Modellentwicklung", "en": "Machine Learning Model Development", "hi": "मशीन लर्निंग मॉडल डेवलपमेंट"}, "required": false}, {"name": {"ar": "دمج نماذج الذكاء الاصطناعي في المنتجات", "de": "KI-Modell-Integration in bestehende Produkte", "en": "AI Model Integration into Existing Products", "hi": "मौजूदा प्रोडक्ट्स में AI मॉडल इंटीग्रेशन"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1500, "minCharge": 1500, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 65, "minCharge": 65, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 16, "minCharge": 16, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 27, "minCharge": 27, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 18, "minCharge": 18, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1500	INR	1	24	https://placehold.co/600x400?text=Gen%2BAI%2BDevelopment	\N	13	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31779	quality-assurance	{"ar": "ضمان الجودة", "de": "Qualitätssicherung", "en": "Quality Assurance", "hi": "क्वालिटी एश्योरेंस"}	{"ar": "اختبارات يدوية + آلية — إصدار بثقة.", "de": "Manuelles + Automated Testing — sicher releasen.", "en": "Manual + automation testing — release with confidence.", "hi": "मैन्युअल + ऑटोमेशन टेस्टिंग — कॉन्फिडेंस के साथ रिलीज़।"}	{"ar": "ضمان جودة شامل عبر الوظيفي والانحدار والأداء والحمل وواجهات برمجة التطبيقات وقواعد البيانات والأمان.", "de": "Umfassende QA — Funktion, Regression, Performance, Load, API, DB, Security — direkt in Ihre CI/CD integriert.", "en": "Comprehensive QA across functional, regression, performance, load, API, database and security testing — tightly integrated into your CI/CD.", "hi": "फंक्शनल, रिग्रेशन, परफॉरमेंस, लोड, API, डेटाबेस और सिक्योरिटी टेस्टिंग — आपके CI/CD में टाइट इंटीग्रेटेड।"}	qa	{"ar": "ضمان الجودة", "de": "Qualitätssicherung", "en": "Quality Assurance", "hi": "क्वालिटी एश्योरेंस"}	[{"name": {"ar": "الاختبار الآلي", "de": "Automatisiertes Testing", "en": "Automation Testing", "hi": "ऑटोमेशन टेस्टिंग"}, "required": false}, {"name": {"ar": "الاختبار الوظيفي اليدوي", "de": "Manuelles Funktions-Testing", "en": "Manual Functional Testing", "hi": "मैन्युअल फंक्शनल टेस्टिंग"}, "required": false}, {"name": {"ar": "اختبار قبول المستخدم (UAT)", "de": "User Acceptance Testing (UAT)", "en": "User Acceptance Testing (UAT)", "hi": "यूज़र एक्सेप्टेंस टेस्टिंग (UAT)"}, "required": false}, {"name": {"ar": "اختبار الأداء", "de": "Performance-Testing", "en": "Performance Testing", "hi": "परफॉरमेंस टेस्टिंग"}, "required": false}, {"name": {"ar": "اختبار التحميل", "de": "Lasttest", "en": "Load Testing", "hi": "लोड टेस्टिंग"}, "required": false}, {"name": {"ar": "اختبار API", "de": "API-Testing", "en": "API Testing", "hi": "API टेस्टिंग"}, "required": false}, {"name": {"ar": "اختبار قواعد البيانات", "de": "Datenbank-Testing", "en": "Database Testing", "hi": "डेटाबेस टेस्टिंग"}, "required": false}, {"name": {"ar": "اختبار الضغط", "de": "Stress-Testing", "en": "Stress Testing", "hi": "स्ट्रेस टेस्टिंग"}, "required": false}, {"name": {"ar": "اختبار الانحدار", "de": "Regressionstest", "en": "Regression Testing", "hi": "रिग्रेशन टेस्टिंग"}, "required": false}, {"name": {"ar": "اختبار الوحدة", "de": "Unit-Testing", "en": "Unit Testing", "hi": "यूनिट टेस्टिंग"}, "required": false}, {"name": {"ar": "اختبار التكامل", "de": "Integrations-Testing", "en": "Integration Testing", "hi": "इंटीग्रेशन टेस्टिंग"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1200, "minCharge": 1200, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 50, "minCharge": 50, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 13, "minCharge": 13, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 22, "minCharge": 22, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 14, "minCharge": 14, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1200	INR	1	24	https://placehold.co/600x400?text=Quality%2BAssurance	\N	9	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31783	seo	{"ar": "تحسين محركات البحث", "de": "SEO", "en": "SEO", "hi": "SEO"}	{"ar": "نمو عضوي مستدام بترتيبات قابلة للقياس.", "de": "Nachhaltiges organisches Wachstum mit messbaren Rankings.", "en": "Sustainable organic growth with measurable rankings.", "hi": "मेज़रेबल रैंकिंग के साथ स्थिर ऑर्गेनिक ग्रोथ।"}	{"ar": "تدقيق SEO تقني وتحسين على الصفحة واستراتيجية المحتوى وبناء الروابط وتحسين Core Web Vitals.", "de": "Technische SEO-Audits, On-Page-Optimierung, Content-Strategie, Linkbuilding und Core Web Vitals.", "en": "Technical SEO audits, on-page optimization, content strategy, link building and Core Web Vitals tuning for measurable organic growth.", "hi": "टेक्निकल SEO ऑडिट, on-page ऑप्टिमाइज़ेशन, कंटेंट स्ट्रैटजी, लिंक बिल्डिंग और Core Web Vitals ट्यूनिंग।"}	marketing	{"ar": "التسويق", "de": "Marketing", "en": "Marketing", "hi": "मार्केटिंग"}	[{"name": {"ar": "كتابة مدونات SEO", "de": "SEO-Blog-Writing", "en": "SEO Blog Writing", "hi": "SEO ब्लॉग राइटिंग"}, "required": false}, {"name": {"ar": "تحسين محركات البحث (SEO)", "de": "Suchmaschinenoptimierung (SEO)", "en": "Search Engine Optimization (SEO)", "hi": "सर्च इंजन ऑप्टिमाइज़ेशन (SEO)"}, "required": false}, {"name": {"ar": "تسويق وسائل التواصل (SMM)", "de": "Social-Media-Marketing (SMM)", "en": "Social Media Marketing (SMM)", "hi": "सोशल मीडिया मार्केटिंग (SMM)"}, "required": false}, {"name": {"ar": "التسويق عبر المؤثرين", "de": "Influencer-Marketing", "en": "Influencer Marketing", "hi": "इन्फ्लुएंसर मार्केटिंग"}, "required": false}, {"name": {"ar": "إعلانات الدفع لكل نقرة (Google/Meta)", "de": "PPC-Werbung (Google/Meta Ads)", "en": "PPC Advertising (Google/Meta Ads)", "hi": "PPC ऐडवर्टाइज़िंग (Google/Meta Ads)"}, "required": false}, {"name": {"ar": "استراتيجية البريد الإلكتروني", "de": "E-Mail-Marketing-Strategie", "en": "Email Marketing Strategy", "hi": "ईमेल मार्केटिंग स्ट्रैटजी"}, "required": false}, {"name": {"ar": "تسويق المحتوى", "de": "Content-Marketing", "en": "Content Marketing", "hi": "कंटेंट मार्केटिंग"}, "required": false}, {"name": {"ar": "تسويق الأداء", "de": "Performance-Marketing", "en": "Performance Marketing", "hi": "परफॉरमेंस मार्केटिंग"}, "required": false}, {"name": {"ar": "خبير CRO", "de": "CRO-Experte", "en": "CRO Expert", "hi": "CRO एक्सपर्ट"}, "required": false}, {"name": {"ar": "تدقيق SEO تقني", "de": "Technische SEO-Audits", "en": "Technical SEO Audits", "hi": "टेक्निकल SEO ऑडिट"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1000, "minCharge": 1000, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 45, "minCharge": 45, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 11, "minCharge": 11, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 18, "minCharge": 18, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 12, "minCharge": 12, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1000	INR	1	24	https://placehold.co/600x400?text=SEO	\N	19	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b3177f	react-js-development	{"ar": "تطوير React.js", "de": "React.js-Entwicklung", "en": "React.js Development", "hi": "React.js डेवलपमेंट"}	{"ar": "React/Next.js للإنتاج مع TypeScript و SSR.", "de": "Produktions-React/Next.js mit TypeScript und SSR.", "en": "Production React/Next.js with TypeScript and SSR.", "hi": "TypeScript और SSR के साथ प्रोडक्शन React/Next.js।"}	{"ar": "بنى React + Next.js حديثة مع App Router و Server Components ووظائف Edge واختبارات شاملة وتحسين Core Web Vitals.", "de": "Moderne React- und Next.js-Builds mit App Router, Server Components, Edge Functions, umfassenden Tests und Core Web Vitals.", "en": "Modern React + Next.js builds with App Router, Server Components, edge functions, comprehensive testing and Core Web Vitals tuning.", "hi": "App Router, Server Components, edge functions, comprehensive testing और Core Web Vitals ट्यूनिंग के साथ मॉडर्न React + Next.js बिल्ड्स।"}	engineering	{"ar": "الهندسة", "de": "Engineering", "en": "Engineering", "hi": "इंजीनियरिंग"}	[{"name": {"ar": "تطوير React.js", "de": "React.js-Entwicklung", "en": "React.js Development", "hi": "React.js डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير Next.js", "de": "Next.js-Entwicklung", "en": "Next.js Development", "hi": "Next.js डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير Vue.js", "de": "Vue.js-Entwicklung", "en": "Vue.js Development", "hi": "Vue.js डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير Angular", "de": "Angular-Entwicklung", "en": "Angular Development", "hi": "Angular डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطبيقات الصفحة الواحدة (SPA)", "de": "Single-Page-Applications (SPA)", "en": "Single Page Applications (SPA)", "hi": "सिंगल पेज ऐप्लिकेशन (SPA)"}, "required": false}, {"name": {"ar": "تطبيقات الويب التقدمية (PWA)", "de": "Progressive Web Apps (PWA)", "en": "Progressive Web Apps (PWA)", "hi": "प्रोग्रेसिव वेब ऐप्स (PWA)"}, "required": false}, {"name": {"ar": "تحسين أداء الويب", "de": "Web-Performance-Optimierung", "en": "Web Performance Optimization", "hi": "वेब परफॉरमेंस ऑप्टिमाइज़ेशन"}, "required": false}, {"name": {"ar": "الامتثال للوصول (WCAG)", "de": "Barrierefreiheit (WCAG)", "en": "Accessibility Compliance (WCAG)", "hi": "एक्सेसिबिलिटी कम्प्लायंस (WCAG)"}, "required": false}, {"name": {"ar": "تطوير مكتبة المكونات", "de": "Komponenten-Bibliotheks-Entwicklung", "en": "Component Library Development", "hi": "कंपोनेंट लाइब्रेरी डेवलपमेंट"}, "required": false}, {"name": {"ar": "TypeScript", "de": "TypeScript", "en": "TypeScript", "hi": "TypeScript"}, "required": false}, {"name": {"ar": "العرض من جانب السيرفر (SSR)", "de": "Server-Side Rendering (SSR)", "en": "Server-Side Rendering (SSR)", "hi": "सर्वर-साइड रेंडरिंग (SSR)"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1300, "minCharge": 1300, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 55, "minCharge": 55, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 14, "minCharge": 14, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 24, "minCharge": 24, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 15, "minCharge": 15, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1300	INR	1	24	https://placehold.co/600x400?text=React.js%2BDevelopment	\N	15	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31777	content-writing	{"ar": "كتابة المحتوى", "de": "Content Writing", "en": "Content Writing", "hi": "कंटेंट राइटिंग"}	{"ar": "محتوى صديق لـ SEO يحقق ترتيبات وتحويلات.", "de": "SEO-freundlicher Content, der rankt und konvertiert.", "en": "SEO-friendly content that ranks and converts.", "hi": "SEO-फ्रेंडली कंटेंट जो रैंक और कन्वर्ट करता है।"}	{"ar": "منشورات مدونات وثائق تقنية وأوراق بيضاء ونصوص إعلانية وتسلسلات بريد إلكتروني للتفاعل وظهور البحث.", "de": "Blogposts, technische Dokus, Whitepaper, Werbetexte und E-Mail-Sequenzen für Engagement und Sichtbarkeit.", "en": "Blog posts, technical docs, whitepapers, ad copy and email sequences crafted for engagement and search visibility.", "hi": "इंगेजमेंट और सर्च विज़िबिलिटी के लिए तैयार किए गए ब्लॉग पोस्ट, टेक्निकल डॉक्स, वाइटपेपर्स, ऐड कॉपी और ईमेल सीक्वेंस।"}	content	{"ar": "المحتوى", "de": "Content", "en": "Content", "hi": "कंटेंट"}	[{"name": {"ar": "كتابة SEO", "de": "SEO-Writing", "en": "SEO Writing", "hi": "SEO राइटिंग"}, "required": false}, {"name": {"ar": "كتابة المدونات", "de": "Blog-Writing", "en": "Blog Writing", "hi": "ब्लॉग राइटिंग"}, "required": false}, {"name": {"ar": "الوثائق التقنية", "de": "Technische Dokumentation", "en": "Technical Documentation", "hi": "टेक्निकल डॉक्यूमेंटेशन"}, "required": false}, {"name": {"ar": "توثيق API", "de": "API-Dokumentation", "en": "API Documentation", "hi": "API डॉक्यूमेंटेशन"}, "required": false}, {"name": {"ar": "الأوراق البيضاء", "de": "Whitepapers", "en": "Whitepapers", "hi": "वाइटपेपर्स"}, "required": false}, {"name": {"ar": "كتابة إعلانات ومبيعات", "de": "Werbe- & Verkaufstexte", "en": "Ad & Sales Copywriting", "hi": "ऐड और सेल्स कॉपीराइटिंग"}, "required": false}, {"name": {"ar": "تسلسلات البريد الإلكتروني", "de": "E-Mail-Marketing-Sequenzen", "en": "Email Marketing Sequences", "hi": "ईमेल मार्केटिंग सीक्वेंस"}, "required": false}, {"name": {"ar": "كتابة الرسائل الإخبارية", "de": "Newsletter-Writing", "en": "Newsletter Writing", "hi": "न्यूज़लेटर राइटिंग"}, "required": false}, {"name": {"ar": "كتابة الكتب الإلكترونية", "de": "Ebook-Writing", "en": "Ebook Writing", "hi": "ईबुक राइटिंग"}, "required": false}, {"name": {"ar": "الكتابة لوسائل التواصل", "de": "Social-Copywriting", "en": "Social Copywriting", "hi": "सोशल कॉपीराइटिंग"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1000, "minCharge": 1000, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 45, "minCharge": 45, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 11, "minCharge": 11, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 18, "minCharge": 18, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 12, "minCharge": 12, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1000	INR	1	24	https://placehold.co/600x400?text=Content%2BWriting	\N	7	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b3177e	api-development	{"ar": "تطوير واجهات برمجة التطبيقات", "de": "API-Entwicklung", "en": "API Development", "hi": "API डेवलपमेंट"}	{"ar": "واجهات REST و GraphQL قوية على نطاق واسع.", "de": "Robuste REST- und GraphQL-APIs im großen Maßstab.", "en": "Robust REST and GraphQL APIs at scale.", "hi": "स्केल पर रोबस्ट REST और GraphQL APIs।"}	{"ar": "تصميم API أولاً مع OAuth/JWT و Idempotency وحدود المعدل والتحقق من المخطط ووثائق OpenAPI كاملة.", "de": "API-First-Design mit OAuth/JWT, Idempotenz, Rate-Limiting, Schema-Validierung und vollständigen OpenAPI-Docs.", "en": "API-first design with OAuth/JWT, idempotency, rate-limiting, schema validation and full OpenAPI documentation.", "hi": "OAuth/JWT, idempotency, rate-limiting, schema validation और पूरी OpenAPI डॉक्यूमेंटेशन के साथ API-first डिज़ाइन।"}	engineering	{"ar": "الهندسة", "de": "Engineering", "en": "Engineering", "hi": "इंजीनियरिंग"}	[{"name": {"ar": "تطوير REST API", "de": "REST-API-Entwicklung", "en": "REST API Development", "hi": "REST API डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير GraphQL API", "de": "GraphQL-API-Entwicklung", "en": "GraphQL API Development", "hi": "GraphQL API डेवलपमेंट"}, "required": false}, {"name": {"ar": "هندسة الخدمات المصغرة", "de": "Microservices-Architektur", "en": "Microservices Architecture", "hi": "माइक्रोसर्विसेज़ आर्किटेक्चर"}, "required": false}, {"name": {"ar": "تصميم وإدارة قواعد البيانات", "de": "Datenbank-Design & -Management", "en": "Database Design & Management", "hi": "डेटाबेस डिज़ाइन और मैनेजमेंट"}, "required": false}, {"name": {"ar": "إعداد المصادقة والتخويل", "de": "Authentifizierungs- & Autorisierungs-Setup", "en": "Authentication & Authorization Setup", "hi": "ऑथेंटिकेशन और ऑथराइज़ेशन सेटअप"}, "required": false}, {"name": {"ar": "تكامل السيرفر", "de": "Server-Integration", "en": "Server Integration", "hi": "सर्वर इंटीग्रेशन"}, "required": false}, {"name": {"ar": "وظائف السحابة (Serverless)", "de": "Cloud Functions (Serverless)", "en": "Cloud Functions (Serverless)", "hi": "क्लाउड फंक्शंस (Serverless)"}, "required": false}, {"name": {"ar": "خطوط معالجة البيانات", "de": "Datenverarbeitungs-Pipelines", "en": "Data Processing Pipelines", "hi": "डेटा प्रोसेसिंग पाइपलाइन"}, "required": false}, {"name": {"ar": "تحسين أداء الخلفية", "de": "Backend-Performance-Optimierung", "en": "Backend Performance Optimization", "hi": "बैकएंड परफॉरमेंस ऑप्टिमाइज़ेशन"}, "required": false}, {"name": {"ar": "توثيق API", "de": "API-Dokumentation", "en": "API Documentation", "hi": "API डॉक्यूमेंटेशन"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1300, "minCharge": 1300, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 55, "minCharge": 55, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 14, "minCharge": 14, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 24, "minCharge": 24, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 15, "minCharge": 15, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1300	INR	1	24	https://placehold.co/600x400?text=API%2BDevelopment	\N	14	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31782	ci-cd-pipeline-management	{"ar": "إدارة CI/CD", "de": "CI/CD-Pipeline-Management", "en": "CI/CD Pipeline Management", "hi": "CI/CD पाइपलाइन मैनेजमेंट"}	{"ar": "بناء واختبار ونشر تلقائي مع التراجع.", "de": "Automatisches Build/Test/Deploy mit Rollback.", "en": "Automated build, test, deploy with rollback.", "hi": "ऑटोमेटेड बिल्ड, टेस्ट, डिप्लॉय with rollback।"}	{"ar": "خطوط GitHub Actions أو GitLab CI أو Jenkins مع إصدارات Canary وتراجع تلقائي ومراقبة كاملة لكل نشر.", "de": "GitHub Actions-, GitLab-CI- oder Jenkins-Pipelines mit Canary-Releases, automatischen Rollbacks und vollständiger Observability.", "en": "GitHub Actions, GitLab CI or Jenkins pipelines with canary releases, automated rollbacks and full observability of every deploy.", "hi": "GitHub Actions, GitLab CI या Jenkins पाइपलाइन — canary releases, automated rollbacks और हर डिप्लॉय की पूरी observability।"}	devops	{"ar": "ديف أوبس", "de": "DevOps", "en": "DevOps", "hi": "DevOps"}	[{"name": {"ar": "إدارة CI/CD", "de": "CI/CD-Pipeline-Management", "en": "CI/CD Pipeline Management", "hi": "CI/CD पाइपलाइन मैनेजमेंट"}, "required": false}, {"name": {"ar": "البنية التحتية كرمز (IaC)", "de": "Infrastructure as Code (IaC)", "en": "Infrastructure as Code (IaC)", "hi": "इंफ्रास्ट्रक्चर ऐज़ कोड (IaC)"}, "required": false}, {"name": {"ar": "الحاويات (Docker)", "de": "Containerisierung (Docker)", "en": "Containerization (Docker)", "hi": "कंटेनराइज़ेशन (Docker)"}, "required": false}, {"name": {"ar": "التنسيق (Kubernetes)", "de": "Orchestrierung (Kubernetes)", "en": "Orchestration (Kubernetes)", "hi": "ऑर्केस्ट्रेशन (Kubernetes)"}, "required": false}, {"name": {"ar": "إدارة السجلات", "de": "Log-Management", "en": "Log Management", "hi": "लॉग मैनेजमेंट"}, "required": false}, {"name": {"ar": "مراقبة الأداء", "de": "Performance-Monitoring", "en": "Performance Monitoring", "hi": "परफॉरमेंस मॉनिटरिंग"}, "required": false}, {"name": {"ar": "مهندس ترحيل", "de": "Migrations-Engineer", "en": "Migration Engineer", "hi": "माइग्रेशन इंजीनियर"}, "required": false}, {"name": {"ar": "أخصائي مراقبة", "de": "Monitoring-Spezialist", "en": "Monitoring Specialist", "hi": "मॉनिटरिंग स्पेशलिस्ट"}, "required": false}, {"name": {"ar": "مهندس استضافة", "de": "Hosting-Engineer", "en": "Hosting Engineer", "hi": "होस्टिंग इंजीनियर"}, "required": false}, {"name": {"ar": "مهندس توسعة", "de": "Scaling-Engineer", "en": "Scaling Engineer", "hi": "स्केलिंग इंजीनियर"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1400, "minCharge": 1400, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 60, "minCharge": 60, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 15, "minCharge": 15, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 25, "minCharge": 25, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 17, "minCharge": 17, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1400	INR	1	24	https://placehold.co/600x400?text=CI%2FCD%2BPipeline%2BManagement	\N	18	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31772	backend-developers	{"ar": "مطورو الخلفية", "de": "Backend-Entwickler", "en": "Backend Developers", "hi": "बैकएंड डेवलपर्स"}	{"ar": "واجهات وقواعد بيانات وخدمات سحابية مجربة.", "de": "Erprobte APIs, Datenbanken und Cloud-Services.", "en": "Battle-tested APIs, databases and cloud-native services.", "hi": "अनुभवी APIs, डेटाबेस और क्लाउड-नेटिव सर्विसेज़।"}	{"ar": "مهندسو خلفية متمرسون يبنون واجهات REST/GraphQL وخدمات مصغرة وخطوط بيانات عالية الإنتاجية على Node أو Python أو Go.", "de": "Senior-Backend-Engineers für REST/GraphQL-APIs, Microservices und High-Throughput-Datenpipelines auf Node, Python oder Go.", "en": "Senior backend engineers building REST/GraphQL APIs, microservices, and high-throughput data pipelines on Node, Python or Go — designed for scale, observability and security from day one.", "hi": "Node, Python या Go पर REST/GraphQL APIs, माइक्रोसर्विसेज़ और हाई-थ्रूपुट डेटा पाइपलाइन बनाने वाले सीनियर बैकएंड इंजीनियर — स्केल, ऑब्ज़र्वेबिलिटी और सिक्योरिटी पहले दिन से।"}	engineering	{"ar": "الهندسة", "de": "Engineering", "en": "Engineering", "hi": "इंजीनियरिंग"}	[{"name": {"ar": "تطوير REST API", "de": "REST-API-Entwicklung", "en": "REST API Development", "hi": "REST API डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير GraphQL API", "de": "GraphQL-API-Entwicklung", "en": "GraphQL API Development", "hi": "GraphQL API डेवलपमेंट"}, "required": false}, {"name": {"ar": "إدارة قواعد البيانات", "de": "Datenbank-Management", "en": "Database Management", "hi": "डेटाबेस मैनेजमेंट"}, "required": false}, {"name": {"ar": "هندسة الخدمات المصغرة", "de": "Microservices-Architektur", "en": "Microservices Architecture", "hi": "माइक्रोसर्विसेज़ आर्किटेक्चर"}, "required": false}, {"name": {"ar": "تكامل السيرفر", "de": "Server-Integration", "en": "Server Integration", "hi": "सर्वर इंटीग्रेशन"}, "required": false}, {"name": {"ar": "وظائف السحابة (Serverless)", "de": "Cloud Functions (Serverless)", "en": "Cloud Functions (Serverless)", "hi": "क्लाउड फंक्शंस (Serverless)"}, "required": false}, {"name": {"ar": "إعداد المصادقة", "de": "Authentifizierungs-Setup", "en": "Authentication Setup", "hi": "ऑथेंटिकेशन सेटअप"}, "required": false}, {"name": {"ar": "النشر السحابي", "de": "Cloud-Deployment", "en": "Cloud Deployment", "hi": "क्लाउड डिप्लॉयमेंट"}, "required": false}, {"name": {"ar": "معالجة البيانات", "de": "Datenverarbeitung", "en": "Data Processing", "hi": "डेटा प्रोसेसिंग"}, "required": false}, {"name": {"ar": "تحسين الأداء", "de": "Performance-Optimierung", "en": "Performance Optimization", "hi": "परफॉरमेंस ऑप्टिमाइज़ेशन"}, "required": false}, {"name": {"ar": "مكتبة المكونات", "de": "Komponenten-Bibliothek", "en": "Component Library", "hi": "कंपोनेंट लाइब्रेरी"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1400, "minCharge": 1400, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 60, "minCharge": 60, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 15, "minCharge": 15, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 25, "minCharge": 25, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 17, "minCharge": 17, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[{"ar": "REST + GraphQL مع وثائق OpenAPI/SDL كاملة", "de": "REST + GraphQL mit vollständigen OpenAPI/SDL-Docs", "en": "REST + GraphQL with full OpenAPI / SDL docs", "hi": "REST + GraphQL — पूरी OpenAPI / SDL डॉक्स के साथ"}, {"ar": "Postgres و MongoDB و Redis و Elasticsearch", "de": "Postgres, MongoDB, Redis, Elasticsearch", "en": "Postgres, MongoDB, Redis, Elasticsearch", "hi": "Postgres, MongoDB, Redis, Elasticsearch"}, {"ar": "JWT/OAuth وحدود المعدل و Idempotency", "de": "JWT/OAuth, Rate-Limiting, Idempotenz", "en": "JWT/OAuth, rate-limiting, idempotency", "hi": "JWT/OAuth, रेट-लिमिटिंग, idempotency"}, {"ar": "نشر سحابي (AWS/GCP/Azure)", "de": "Cloud-natives Deployment (AWS/GCP/Azure)", "en": "Cloud-native deployment (AWS/GCP/Azure)", "hi": "क्लाउड-नेटिव डिप्लॉयमेंट (AWS/GCP/Azure)"}]	[{"ar": "تصميم API ومواصفات OpenAPI", "de": "API-Design und OpenAPI-Spec", "en": "API design and OpenAPI spec", "hi": "API डिज़ाइन और OpenAPI स्पेक"}, {"ar": "مخطط قاعدة البيانات والترحيل", "de": "Datenbank-Schema und Migrationen", "en": "Database schema and migrations", "hi": "डेटाबेस स्कीमा और माइग्रेशन"}, {"ar": "المصادقة وحدود المعدل ومعالجة الأخطاء", "de": "Auth, Rate-Limit, Fehlerbehandlung", "en": "Auth, rate-limit, error handling", "hi": "ऑथ, रेट-लिमिट, एरर हैंडलिंग"}, {"ar": "اختبارات + إعداد خط CI", "de": "Tests + CI-Pipeline-Setup", "en": "Tests + CI pipeline setup", "hi": "टेस्ट्स + CI पाइपलाइन सेटअप"}]	[{"ar": "أعمال الواجهة الأمامية / UI", "de": "Frontend- / UI-Arbeiten", "en": "Frontend / UI work", "hi": "फ्रंटएंड / UI काम"}, {"ar": "فاتورة السحابة / تكاليف البنية", "de": "Cloud-Rechnung / Infra-Kosten", "en": "Cloud bill / infra costs", "hi": "क्लाउड बिल / इंफ्रा लागत"}]	[{"answer": {"ar": "Node.js (TypeScript)، Python (FastAPI/Django)، Go (Gin/Fiber)، Java (Spring).", "de": "Node.js (TypeScript), Python (FastAPI/Django), Go (Gin/Fiber), Java (Spring).", "en": "Node.js (TypeScript), Python (FastAPI/Django), Go (Gin/Fiber), Java (Spring).", "hi": "Node.js (TypeScript), Python (FastAPI/Django), Go (Gin/Fiber), Java (Spring)।"}, "question": {"ar": "ما هي حزم اللغات التي تغطونها؟", "de": "Welche Sprachstacks decken Sie ab?", "en": "Which language stacks do you cover?", "hi": "आप कौन से लैंग्वेज स्टैक कवर करते हैं?"}}]	1400	INR	1	24	https://placehold.co/600x400?text=Backend%2BDevelopers	\N	2	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31780	website-design	{"ar": "تصميم المواقع", "de": "Website-Design", "en": "Website Design", "hi": "वेबसाइट डिज़ाइन"}	{"ar": "مواقع متماشية مع الهوية ومركزة على التحويل.", "de": "Markenkonforme, konversionsorientierte Websites.", "en": "Brand-aligned, conversion-driven websites.", "hi": "ब्रैंड-अलाइन्ड, कन्वर्ज़न-ड्रिवन वेबसाइट्स।"}	{"ar": "مواقع حديثة متجاوبة بهيكل معلومات قوي وتصميم قابل للوصول وتخطيطات تركز على CRO تحول الزوار إلى عملاء.", "de": "Moderne responsive Websites mit klarer IA, barrierefreiem Design und CRO-fokussierten Layouts.", "en": "Modern responsive websites with strong information architecture, accessible design and CRO-first layouts that turn visitors into customers.", "hi": "स्ट्रॉन्ग information architecture, accessible डिज़ाइन और CRO-first लेआउट के साथ मॉडर्न responsive वेबसाइट्स।"}	design	{"ar": "التصميم", "de": "Design", "en": "Design", "hi": "डिज़ाइन"}	[{"name": {"ar": "إنشاء كتاب الهوية", "de": "Brand-Book-Erstellung", "en": "Brand Book Creation", "hi": "ब्रैंड बुक क्रिएशन"}, "required": false}, {"name": {"ar": "تصميم تطبيقات الجوال", "de": "Mobile-App-Design", "en": "Mobile App Design", "hi": "मोबाइल ऐप डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم المواقع", "de": "Website-Design", "en": "Website Design", "hi": "वेबसाइट डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم صفحة الهبوط", "de": "Landingpage-Design", "en": "Landing Page Design", "hi": "लैंडिंग पेज डिज़ाइन"}, "required": false}, {"name": {"ar": "التصميم الجرافيكي", "de": "Grafikdesign", "en": "Graphic Design", "hi": "ग्राफिक डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم UI/UX", "de": "UI/UX-Design", "en": "UI/UX Design", "hi": "UI/UX डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم النموذج الأولي", "de": "Prototyp-Design", "en": "Prototype Design", "hi": "प्रोटोटाइप डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم Wireframe", "de": "Wireframe-Design", "en": "Wireframe Design", "hi": "वायरफ्रेम डिज़ाइन"}, "required": false}, {"name": {"ar": "تصميم عرض الشركة / المستثمر", "de": "Investor-Deck-Design", "en": "Company / Investor Deck Design", "hi": "कंपनी / इन्वेस्टर डेक डिज़ाइन"}, "required": false}, {"name": {"ar": "إنشاء نظام التصميم", "de": "Design-System-Erstellung", "en": "Design System Creation", "hi": "डिज़ाइन सिस्टम क्रिएशन"}, "required": false}, {"name": {"ar": "رسم رحلة المستخدم", "de": "User-Journey-Mapping", "en": "User Journey Mapping", "hi": "यूज़र जर्नी मैपिंग"}, "required": false}, {"name": {"ar": "UX يركز على التحويل", "de": "Conversion-fokussiertes UX", "en": "Conversion-Focused UX", "hi": "कन्वर्जन-फ़ोकस्ड UX"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1100, "minCharge": 1100, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 50, "minCharge": 50, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 12, "minCharge": 12, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 20, "minCharge": 20, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 13, "minCharge": 13, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1100	INR	1	24	https://placehold.co/600x400?text=Website%2BDesign	\N	16	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b3177a	mobile-app-development	{"ar": "تطوير تطبيقات الجوال", "de": "Mobile-App-Entwicklung", "en": "Mobile App Development", "hi": "मोबाइल ऐप डेवलपमेंट"}	{"ar": "متعدد المنصات وأصلي — iOS و Android والويب.", "de": "Cross-Platform und Native — iOS, Android, Web.", "en": "Cross-platform and native — iOS, Android, web.", "hi": "क्रॉस-प्लेटफ़ॉर्म और नेटिव — iOS, Android, वेब।"}	{"ar": "Flutter / React Native متعدد المنصات + تطبيقات Swift / Kotlin أصلية مع نشر على المتاجر و ASO ودعم بعد الإطلاق.", "de": "Flutter / React Native Cross-Platform + native Swift / Kotlin Apps mit Store-Deployment, ASO und Post-Launch-Support.", "en": "Flutter / React Native cross-platform builds plus native Swift / Kotlin apps with App Store and Play Store deployment, ASO and post-launch support.", "hi": "Flutter / React Native क्रॉस-प्लेटफ़ॉर्म + नेटिव Swift / Kotlin ऐप्स — App Store/Play Store deployment, ASO और post-launch सपोर्ट के साथ।"}	mobile	{"ar": "تطوير الجوال", "de": "Mobile-Entwicklung", "en": "Mobile Development", "hi": "मोबाइल डेवलपमेंट"}	[{"name": {"ar": "تطوير Flutter", "de": "Flutter-Entwicklung", "en": "Flutter Development", "hi": "Flutter डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير React Native", "de": "React-Native-Entwicklung", "en": "React Native Development", "hi": "React Native डेवलपमेंट"}, "required": false}, {"name": {"ar": "iOS الأصلي (Swift)", "de": "Natives iOS (Swift)", "en": "Native iOS (Swift)", "hi": "नेटिव iOS (Swift)"}, "required": false}, {"name": {"ar": "Android الأصلي (Kotlin)", "de": "Natives Android (Kotlin)", "en": "Native Android (Kotlin)", "hi": "नेटिव Android (Kotlin)"}, "required": false}, {"name": {"ar": "نشر متجر التطبيقات و Play Store", "de": "App-Store- & Play-Store-Deployment", "en": "App Store & Play Store Deployment", "hi": "App Store और Play Store डिप्लॉयमेंट"}, "required": false}, {"name": {"ar": "تكامل تطبيقات IoT", "de": "IoT-App-Integration", "en": "IoT App Integration", "hi": "IoT ऐप इंटीग्रेशन"}, "required": false}, {"name": {"ar": "تجارب AR / VR للجوال", "de": "AR/VR-Mobile-Experiences", "en": "AR / VR Mobile Experiences", "hi": "AR / VR मोबाइल अनुभव"}, "required": false}, {"name": {"ar": "تحسين متجر التطبيقات (ASO)", "de": "App-Store-Optimization (ASO)", "en": "App Store Optimization (ASO)", "hi": "ऐप स्टोर ऑप्टिमाइज़ेशन (ASO)"}, "required": false}, {"name": {"ar": "صيانة ودعم تطبيقات الجوال", "de": "Mobile-App-Wartung & -Support", "en": "Mobile App Maintenance & Support", "hi": "मोबाइल ऐप मेंटेनेंस और सपोर्ट"}, "required": false}, {"name": {"ar": "تطوير تطبيقات الأجهزة اللوحية والقابلة للطي", "de": "Tablet- & Foldable-App-Entwicklung", "en": "Tablet & Foldable App Development", "hi": "टैबलेट और फ़ोल्डेबल ऐप डेवलपमेंट"}, "required": false}, {"name": {"ar": "تطوير تطبيقات الأجهزة القابلة للارتداء", "de": "Wearable-App-Entwicklung", "en": "Wearable App Development", "hi": "वियरेबल ऐप डेवलपमेंट"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1350, "minCharge": 1350, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 60, "minCharge": 60, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 15, "minCharge": 15, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 25, "minCharge": 25, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 16, "minCharge": 16, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1350	INR	1	24	https://placehold.co/600x400?text=Mobile%2BApp%2BDevelopment	\N	10	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b3177c	security-testing	{"ar": "اختبار الأمان", "de": "Security Testing", "en": "Security Testing", "hi": "सिक्योरिटी टेस्टिंग"}	{"ar": "اكتشاف الثغرات قبل المهاجمين.", "de": "Schwachstellen finden, bevor Angreifer sie nutzen.", "en": "Find vulnerabilities before attackers do.", "hi": "अटैकर्स से पहले vulnerabilities खोजें।"}	{"ar": "VAPT والاختراق و SAST/DAST/IAST وتدقيق الامتثال (GDPR/SOC2) و Red Teaming وحماية وقت التشغيل ومراجعة البنية الآمنة.", "de": "VAPT, Pen-Testing, SAST/DAST/IAST, Compliance-Audits (DSGVO/SOC2), Red Teaming, Laufzeitschutz und sichere Architektur-Reviews.", "en": "VAPT, pen-testing, SAST/DAST/IAST, compliance audits (GDPR/SOC2), red teaming, runtime defence and secure architecture reviews.", "hi": "VAPT, पेन-टेस्टिंग, SAST/DAST/IAST, कम्प्लायंस ऑडिट (GDPR/SOC2), रेड टीमिंग, रनटाइम डिफेंस और सिक्योर आर्किटेक्चर रिव्यू।"}	security	{"ar": "الأمان", "de": "Sicherheit", "en": "Security", "hi": "सिक्योरिटी"}	[{"name": {"ar": "تقييم الثغرات (VAPT)", "de": "Schwachstellenbewertung (VAPT)", "en": "Vulnerability Assessment (VAPT)", "hi": "वल्नरबिलिटी असेसमेंट (VAPT)"}, "required": false}, {"name": {"ar": "اختبار الاختراق", "de": "Penetrationstest", "en": "Penetration Testing", "hi": "पेनिट्रेशन टेस्टिंग"}, "required": false}, {"name": {"ar": "تدقيق الامتثال (GDPR/SOC2)", "de": "Compliance-Audits (DSGVO/SOC2)", "en": "Compliance Audits (GDPR/SOC2)", "hi": "कम्प्लायंस ऑडिट (GDPR/SOC2)"}, "required": false}, {"name": {"ar": "التحليل الثابت للكود (SAST)", "de": "Static Code Analysis (SAST)", "en": "Static Code Analysis (SAST)", "hi": "स्टैटिक कोड एनालिसिस (SAST)"}, "required": false}, {"name": {"ar": "DAST (الفحص أثناء التشغيل)", "de": "DAST (Laufzeit-Scanning)", "en": "DAST (Runtime Scanning)", "hi": "DAST (रनटाइम स्कैनिंग)"}, "required": false}, {"name": {"ar": "IAST (التحليل الهجين)", "de": "IAST (Hybride Analyse)", "en": "IAST (Hybrid Analysis)", "hi": "IAST (हाइब्रिड एनालिसिस)"}, "required": false}, {"name": {"ar": "SCA (فحص التبعيات)", "de": "SCA (Dependency-Scanning)", "en": "SCA (Dependency Scanning)", "hi": "SCA (डिपेंडेंसी स्कैनिंग)"}, "required": false}, {"name": {"ar": "اختبار أمان API", "de": "API-Sicherheits-Testing", "en": "API Security Testing", "hi": "API सिक्योरिटी टेस्टिंग"}, "required": false}, {"name": {"ar": "أمان الحاويات", "de": "Container-Sicherheit", "en": "Container Security", "hi": "कंटेनर सिक्योरिटी"}, "required": false}, {"name": {"ar": "أمان تطبيقات الجوال (MAST)", "de": "Mobile-App-Sicherheit (MAST)", "en": "Mobile App Security (MAST)", "hi": "मोबाइल ऐप सिक्योरिटी (MAST)"}, "required": false}, {"name": {"ar": "وضع الأمان السحابي (CSPM)", "de": "Cloud Posture (CSPM)", "en": "Cloud Posture (CSPM)", "hi": "क्लाउड पोस्चर (CSPM)"}, "required": false}, {"name": {"ar": "محاكاة التصيد الاحتيالي", "de": "Phishing-Simulation", "en": "Phishing Simulation", "hi": "फ़िशिंग सिमुलेशन"}, "required": false}, {"name": {"ar": "Red Teaming", "de": "Red Teaming", "en": "Red Teaming", "hi": "रेड टीमिंग"}, "required": false}, {"name": {"ar": "الحماية أثناء التشغيل (RASP)", "de": "Runtime-Schutz (RASP)", "en": "Runtime Protection (RASP)", "hi": "रनटाइम प्रोटेक्शन (RASP)"}, "required": false}, {"name": {"ar": "بنية الخلفية الآمنة", "de": "Sichere Backend-Architektur", "en": "Secure Backend Architecture", "hi": "सिक्योर बैकएंड आर्किटेक्चर"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1500, "minCharge": 1500, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 65, "minCharge": 65, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 16, "minCharge": 16, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 27, "minCharge": 27, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 18, "minCharge": 18, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1500	INR	1	24	https://placehold.co/600x400?text=Security%2BTesting	\N	12	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31771	ai-engineers	{"ar": "مهندسو الذكاء الاصطناعي", "de": "KI-Ingenieure", "en": "AI Engineers", "hi": "AI इंजीनियर"}	{"ar": "ذكاء اصطناعي بمستوى إنتاجي من النموذج الأولي إلى النشر.", "de": "Produktionsreife KI vom Prototyp bis zum deployten Modell.", "en": "Production-grade AI from prototype to deployed model.", "hi": "प्रोटोटाइप से प्रोडक्शन तक — डिप्लॉय्ड AI मॉडल्स।"}	{"ar": "مهندسو ذكاء اصطناعي متمرسون لأنظمة LLM والرؤية والمعالجة اللغوية والتحليلات التنبؤية — نتولى دورة الحياة الكاملة من إعداد البيانات إلى النشر والمراقبة والتقييم المستمر.", "de": "Senior-KI-Ingenieure für LLMs, Computer Vision, NLP und Predictive Analytics — wir verantworten den gesamten Lebenszyklus von Datenaufbereitung bis Deployment und kontinuierlicher Evaluation.", "en": "Senior AI engineers for LLMs, computer vision, NLP and predictive analytics — we own the full lifecycle from data prep to deployment, monitoring and continuous evaluation.", "hi": "LLM, कंप्यूटर विज़न, NLP और प्रिडिक्टिव एनालिटिक्स के लिए सीनियर AI इंजीनियर — डेटा प्रेप से लेकर डिप्लॉयमेंट, मॉनिटरिंग और लगातार मूल्यांकन तक पूरा जीवन-चक्र।"}	ai	{"ar": "الذكاء الاصطناعي والتعلم الآلي", "de": "KI & Machine Learning", "en": "AI & Machine Learning", "hi": "AI और मशीन लर्निंग"}	[{"name": {"ar": "حلول الذكاء الاصطناعي التوليدي", "de": "Gen-KI-Lösungen", "en": "Gen AI Solutions", "hi": "Gen AI सॉल्यूशंस"}, "required": false}, {"name": {"ar": "تكامل LLM", "de": "LLM-Integration", "en": "LLM Integration", "hi": "LLM इंटीग्रेशन"}, "required": false}, {"name": {"ar": "هندسة الموجهات", "de": "Prompt Engineering", "en": "Prompt Engineering", "hi": "प्रॉम्प्ट इंजीनियरिंग"}, "required": false}, {"name": {"ar": "التحليلات التنبؤية", "de": "Predictive Analytics", "en": "Predictive Analytics", "hi": "प्रिडिक्टिव एनालिटिक्स"}, "required": false}, {"name": {"ar": "الرؤية الحاسوبية", "de": "Computer Vision", "en": "Computer Vision", "hi": "कंप्यूटर विज़न"}, "required": false}, {"name": {"ar": "معالجة اللغة الطبيعية (NLP)", "de": "Natural Language Processing (NLP)", "en": "Natural Language Processing (NLP)", "hi": "नेचुरल लैंग्वेज प्रोसेसिंग (NLP)"}, "required": false}, {"name": {"ar": "روبوتات الدردشة بالذكاء الاصطناعي", "de": "KI-Chatbots", "en": "AI Chatbots", "hi": "AI चैटबॉट"}, "required": false}, {"name": {"ar": "مهندس تعلم آلي", "de": "ML-Engineer", "en": "ML Engineer", "hi": "ML इंजीनियर"}, "required": false}, {"name": {"ar": "مطور قاعدة بيانات Vector", "de": "Vector-Datenbank-Entwickler", "en": "Vector Database Developer", "hi": "वेक्टर डेटाबेस डेवलपर"}, "required": false}, {"name": {"ar": "مهندس رؤية", "de": "Vision-Engineer", "en": "Vision Engineer", "hi": "विज़न इंजीनियर"}, "required": false}, {"name": {"ar": "أنظمة RAG", "de": "RAG-Systeme", "en": "RAG Systems", "hi": "RAG सिस्टम"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1500, "minCharge": 1500, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 65, "minCharge": 65, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 16, "minCharge": 16, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 27, "minCharge": 27, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 18, "minCharge": 18, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[{"ar": "تدريب وضبط دقيق للنماذج المخصصة", "de": "Eigenes Training und Fine-Tuning", "en": "Custom model training and fine-tuning", "hi": "कस्टम मॉडल ट्रेनिंग और फाइन-ट्यूनिंग"}, {"ar": "قواعد بيانات Vector وRAG والبحث الدلالي", "de": "Vektor-DBs, RAG und semantische Suche", "en": "Vector DBs, RAG and semantic search", "hi": "वेक्टर DBs, RAG और सिमेंटिक सर्च"}, {"ar": "نشر إنتاجي على AWS / GCP", "de": "Produktions-Deployment auf AWS / GCP", "en": "Production deployment on AWS / GCP", "hi": "AWS / GCP पर प्रोडक्शन डिप्लॉयमेंट"}, {"ar": "المراقبة وإعادة التدريب المستمرة", "de": "Kontinuierliches Monitoring & Re-Training", "en": "Continuous monitoring and re-training", "hi": "कंटिन्यूअस मॉनिटरिंग और रि-ट्रेनिंग"}]	[{"ar": "اكتشاف وتدقيق البيانات", "de": "Discovery & Daten-Audit", "en": "Discovery & data audit", "hi": "डिस्कवरी और डेटा ऑडिट"}, {"ar": "اختيار النماذج أو الضبط الدقيق", "de": "Modellauswahl oder Fine-Tuning", "en": "Model selection or fine-tuning", "hi": "मॉडल सेलेक्शन या फाइन-ट्यूनिंग"}, {"ar": "API الاستدلال + المصادقة", "de": "Inferenz-API + Auth", "en": "Inference API + auth", "hi": "इंफरेंस API + ऑथ"}, {"ar": "تقارير التقييم", "de": "Auswertungsberichte", "en": "Evaluation reports", "hi": "मूल्यांकन रिपोर्ट्स"}]	[{"ar": "تكاليف الاستضافة / البنية التحتية لـ GPU", "de": "Hosting- / GPU-Infrastrukturkosten", "en": "Hosting / GPU infrastructure costs", "hi": "होस्टिंग / GPU इंफ्रास्ट्रक्चर लागत"}, {"ar": "رسوم استخدام واجهات برمجة التطبيقات الخارجية", "de": "Drittanbieter-API-Nutzungsgebühren", "en": "Third-party API usage charges", "hi": "थर्ड-पार्टी API यूज़ेज चार्जेज़"}]	[{"answer": {"ar": "GPT-4 و Claude و Gemini و Llama 3 و Mistral، بالإضافة إلى نماذج CV/NLP مفتوحة المصدر.", "de": "GPT-4, Claude, Gemini, Llama 3, Mistral plus Open-Source-CV/NLP-Modelle.", "en": "GPT-4, Claude, Gemini, Llama 3, Mistral, plus open-source CV/NLP models.", "hi": "GPT-4, Claude, Gemini, Llama 3, Mistral, और open-source CV/NLP मॉडल्स।"}, "question": {"ar": "مع أي نماذج تعملون؟", "de": "Mit welchen Modellen arbeiten Sie?", "en": "Which models do you work with?", "hi": "आप कौन से मॉडल्स के साथ काम करते हैं?"}}, {"answer": {"ar": "نعم — هياكل متوافقة مع GDPR و HIPAA و SOC 2 مع خيارات داخل المؤسسة عند الحاجة.", "de": "Ja — DSGVO-, HIPAA-, SOC-2-konforme Architekturen mit On-Prem-Optionen.", "en": "Yes — GDPR, HIPAA, SOC 2 friendly architectures with on-prem options where required.", "hi": "हाँ — GDPR, HIPAA, SOC 2 फ्रेंडली आर्किटेक्चर, जहाँ ज़रूरी हो वहाँ on-prem options भी।"}, "question": {"ar": "هل تتعاملون مع الامتثال لخصوصية البيانات؟", "de": "Behandeln Sie Datenschutz-Compliance?", "en": "Do you handle data privacy compliance?", "hi": "क्या आप डेटा प्राइवेसी कम्प्लायंस संभालते हैं?"}}]	1500	INR	1	24	https://placehold.co/600x400?text=AI%2BEngineers	\N	1	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31778	digital-marketing	{"ar": "التسويق الرقمي", "de": "Digital Marketing", "en": "Digital Marketing", "hi": "डिजिटल मार्केटिंग"}	{"ar": "نمو شامل بقياس عائد الاستثمار.", "de": "Full-Funnel-Wachstum mit messbarem ROI.", "en": "Full-funnel growth with measurable ROI.", "hi": "मेज़रेबल ROI के साथ फुल-फनल ग्रोथ।"}	{"ar": "SEO و SMM و PPC والمؤثرين والبريد الإلكتروني — حملات مصممة لتوليد عملاء محتملين وإيرادات قابلة للقياس.", "de": "SEO, SMM, PPC, Influencer und E-Mail-Marketing — Kampagnen für qualifizierte Leads und messbaren Umsatz.", "en": "SEO, SMM, PPC, influencer outreach and email marketing — campaigns built to generate qualified leads and measurable revenue.", "hi": "SEO, SMM, PPC, इन्फ्लुएंसर आउटरीच और ईमेल मार्केटिंग — qualified leads और मेज़रेबल रेवेन्यू के लिए बनाए कैम्पेन।"}	marketing	{"ar": "التسويق", "de": "Marketing", "en": "Marketing", "hi": "मार्केटिंग"}	[{"name": {"ar": "تحسين محركات البحث (SEO)", "de": "Suchmaschinenoptimierung (SEO)", "en": "Search Engine Optimization (SEO)", "hi": "सर्च इंजन ऑप्टिमाइज़ेशन (SEO)"}, "required": false}, {"name": {"ar": "تسويق وسائل التواصل (SMM)", "de": "Social-Media-Marketing (SMM)", "en": "Social Media Marketing (SMM)", "hi": "सोशल मीडिया मार्केटिंग (SMM)"}, "required": false}, {"name": {"ar": "التسويق عبر المؤثرين", "de": "Influencer-Marketing", "en": "Influencer Marketing", "hi": "इन्फ्लुएंसर मार्केटिंग"}, "required": false}, {"name": {"ar": "إعلانات الدفع لكل نقرة (Google/Meta)", "de": "PPC-Werbung (Google/Meta Ads)", "en": "PPC Advertising (Google/Meta Ads)", "hi": "PPC ऐडवर्टाइज़िंग (Google/Meta Ads)"}, "required": false}, {"name": {"ar": "استراتيجية البريد الإلكتروني", "de": "E-Mail-Marketing-Strategie", "en": "Email Marketing Strategy", "hi": "ईमेल मार्केटिंग स्ट्रैटजी"}, "required": false}, {"name": {"ar": "تسويق المحتوى", "de": "Content-Marketing", "en": "Content Marketing", "hi": "कंटेंट मार्केटिंग"}, "required": false}, {"name": {"ar": "تسويق الأداء", "de": "Performance-Marketing", "en": "Performance Marketing", "hi": "परफॉरमेंस मार्केटिंग"}, "required": false}, {"name": {"ar": "التسويق الاجتماعي", "de": "Social-Marketing", "en": "Social Marketing", "hi": "सोशल मार्केटिंग"}, "required": false}, {"name": {"ar": "خبير CRO", "de": "CRO-Experte", "en": "CRO Expert", "hi": "CRO एक्सपर्ट"}, "required": false}, {"name": {"ar": "خبير التحليلات", "de": "Analytics-Experte", "en": "Analytics Expert", "hi": "एनालिटिक्स एक्सपर्ट"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1100, "minCharge": 1100, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 50, "minCharge": 50, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 12, "minCharge": 12, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 20, "minCharge": 20, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 13, "minCharge": 13, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1100	INR	1	24	https://placehold.co/600x400?text=Digital%2BMarketing	\N	8	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31776	devops	{"ar": "DevOps", "de": "DevOps", "en": "DevOps", "hi": "DevOps"}	{"ar": "CI/CD وIaC وقابلية المراقبة — نشر آمن.", "de": "CI/CD, IaC und Observability — sicher deployen.", "en": "CI/CD, IaC and observability — ship safely.", "hi": "CI/CD, IaC और observability — सुरक्षित डिप्लॉय।"}	{"ar": "أتمتة خطوط الأنابيب مع GitHub Actions/GitLab/Jenkins، IaC باستخدام Terraform، تنسيق الحاويات على Kubernetes، والمراقبة الشاملة.", "de": "Pipeline-Automatisierung mit GitHub Actions/GitLab/Jenkins, IaC mit Terraform, Container-Orchestrierung auf Kubernetes plus Full-Stack-Observability.", "en": "Pipeline automation with GitHub Actions/GitLab/Jenkins, IaC with Terraform, container orchestration on Kubernetes, plus full-stack observability.", "hi": "GitHub Actions/GitLab/Jenkins से पाइपलाइन ऑटोमेशन, Terraform से IaC, Kubernetes पर कंटेनर ऑर्केस्ट्रेशन, और फुल-स्टैक observability।"}	devops	{"ar": "ديف أوبس", "de": "DevOps", "en": "DevOps", "hi": "DevOps"}	[{"name": {"ar": "إدارة CI/CD", "de": "CI/CD-Pipeline-Management", "en": "CI/CD Pipeline Management", "hi": "CI/CD पाइपलाइन मैनेजमेंट"}, "required": false}, {"name": {"ar": "البنية التحتية كرمز (IaC)", "de": "Infrastructure as Code (IaC)", "en": "Infrastructure as Code (IaC)", "hi": "इंफ्रास्ट्रक्चर ऐज़ कोड (IaC)"}, "required": false}, {"name": {"ar": "الحاويات (Docker)", "de": "Containerisierung (Docker)", "en": "Containerization (Docker)", "hi": "कंटेनराइज़ेशन (Docker)"}, "required": false}, {"name": {"ar": "التنسيق (Kubernetes)", "de": "Orchestrierung (Kubernetes)", "en": "Orchestration (Kubernetes)", "hi": "ऑर्केस्ट्रेशन (Kubernetes)"}, "required": false}, {"name": {"ar": "إدارة السجلات", "de": "Log-Management", "en": "Log Management", "hi": "लॉग मैनेजमेंट"}, "required": false}, {"name": {"ar": "مراقبة الأداء", "de": "Performance-Monitoring", "en": "Performance Monitoring", "hi": "परफॉरमेंस मॉनिटरिंग"}, "required": false}, {"name": {"ar": "مهندس ترحيل", "de": "Migrations-Engineer", "en": "Migration Engineer", "hi": "माइग्रेशन इंजीनियर"}, "required": false}, {"name": {"ar": "أخصائي مراقبة", "de": "Monitoring-Spezialist", "en": "Monitoring Specialist", "hi": "मॉनिटरिंग स्पेशलिस्ट"}, "required": false}, {"name": {"ar": "مهندس استضافة", "de": "Hosting-Engineer", "en": "Hosting Engineer", "hi": "होस्टिंग इंजीनियर"}, "required": false}, {"name": {"ar": "مهندس توسعة", "de": "Scaling-Engineer", "en": "Scaling Engineer", "hi": "स्केलिंग इंजीनियर"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1400, "minCharge": 1400, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 60, "minCharge": 60, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 15, "minCharge": 15, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 25, "minCharge": 25, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 17, "minCharge": 17, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1400	INR	1	24	https://placehold.co/600x400?text=DevOps	\N	6	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31784	blog-writing	{"ar": "كتابة المدونات", "de": "Blog-Writing", "en": "Blog Writing", "hi": "ब्लॉग राइटिंग"}	{"ar": "مدونات طويلة تحقق ترتيبات وتفاعل.", "de": "Long-Form-Blogs, die ranken und engagieren.", "en": "Long-form blogs that rank and engage.", "hi": "लॉन्ग-फ़ॉर्म ब्लॉग्स जो रैंक और एंगेज करते हैं।"}	{"ar": "محتوى مدونات طويل ومدروس ومُحسّن لنية البحث وتفاعل القارئ ودعوات التحويل.", "de": "Gut recherchierte Long-Form-Blogs, optimiert für Search Intent, Engagement und Conversion-CTAs.", "en": "Well-researched, long-form blog content optimized for search intent, reader engagement and conversion CTAs.", "hi": "सर्च इंटेंट, रीडर एंगेजमेंट और कन्वर्ज़न CTAs के लिए ऑप्टिमाइज़्ड well-researched long-form ब्लॉग कंटेंट।"}	content	{"ar": "المحتوى", "de": "Content", "en": "Content", "hi": "कंटेंट"}	[{"name": {"ar": "كتابة SEO", "de": "SEO-Writing", "en": "SEO Writing", "hi": "SEO राइटिंग"}, "required": false}, {"name": {"ar": "كتابة المدونات", "de": "Blog-Writing", "en": "Blog Writing", "hi": "ब्लॉग राइटिंग"}, "required": false}, {"name": {"ar": "الوثائق التقنية", "de": "Technische Dokumentation", "en": "Technical Documentation", "hi": "टेक्निकल डॉक्यूमेंटेशन"}, "required": false}, {"name": {"ar": "توثيق API", "de": "API-Dokumentation", "en": "API Documentation", "hi": "API डॉक्यूमेंटेशन"}, "required": false}, {"name": {"ar": "الأوراق البيضاء", "de": "Whitepapers", "en": "Whitepapers", "hi": "वाइटपेपर्स"}, "required": false}, {"name": {"ar": "كتابة إعلانات ومبيعات", "de": "Werbe- & Verkaufstexte", "en": "Ad & Sales Copywriting", "hi": "ऐड और सेल्स कॉपीराइटिंग"}, "required": false}, {"name": {"ar": "تسلسلات البريد الإلكتروني", "de": "E-Mail-Marketing-Sequenzen", "en": "Email Marketing Sequences", "hi": "ईमेल मार्केटिंग सीक्वेंस"}, "required": false}, {"name": {"ar": "كتابة الرسائل الإخبارية", "de": "Newsletter-Writing", "en": "Newsletter Writing", "hi": "न्यूज़लेटर राइटिंग"}, "required": false}, {"name": {"ar": "كتابة الكتب الإلكترونية", "de": "Ebook-Writing", "en": "Ebook Writing", "hi": "ईबुक राइटिंग"}, "required": false}, {"name": {"ar": "الكتابة لوسائل التواصل", "de": "Social-Copywriting", "en": "Social Copywriting", "hi": "सोशल कॉपीराइटिंग"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1000, "minCharge": 1000, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 45, "minCharge": 45, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 11, "minCharge": 11, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 18, "minCharge": 18, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 12, "minCharge": 12, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[]	[]	[]	[]	1000	INR	1	24	https://placehold.co/600x400?text=Blog%2BWriting	\N	20	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
69fb01ae46a7a8a8c7b31775	it-support	{"ar": "دعم تقنية المعلومات", "de": "IT-Support", "en": "IT Support", "hi": "IT सपोर्ट"}	{"ar": "مكتب مساعدة 24/7 وعمليات البنية التحتية.", "de": "24/7 Helpdesk und Infrastruktur-Betrieb.", "en": "24/7 help desk and infrastructure operations.", "hi": "24/7 हेल्प डेस्क और इंफ्रास्ट्रक्चर ऑपरेशन्स।"}	{"ar": "مكتب مساعدة L1/L2/L3 على مدار الساعة، إدارة السيرفر، عمليات الشبكة، إدارة VPN/جدار الحماية، النسخ الاحتياطي والتعافي من الكوارث.", "de": "L1/L2/L3-Helpdesk rund um die Uhr, Serveradministration, Netzwerkbetrieb, VPN/Firewall, Backups und Disaster Recovery.", "en": "Round-the-clock L1/L2/L3 help desk, server administration, network operations, VPN/firewall management, backups and disaster recovery — for offices, SaaS and remote teams.", "hi": "24/7 L1/L2/L3 हेल्प डेस्क, सर्वर एडमिन, नेटवर्क ऑप्स, VPN/फ़ायरवॉल मैनेजमेंट, बैकअप और डिज़ास्टर रिकवरी — ऑफिस, SaaS और रिमोट टीम्स के लिए।"}	it-services	{"ar": "خدمات تقنية المعلومات", "de": "IT-Services", "en": "IT Services", "hi": "IT सर्विसेज़"}	[{"name": {"ar": "إدارة السيرفر", "de": "Serveradministration", "en": "Server Administration", "hi": "सर्वर एडमिनिस्ट्रेशन"}, "required": false}, {"name": {"ar": "مكتب مساعدة 24/7 (L1/L2/L3)", "de": "24/7-Helpdesk (L1/L2/L3)", "en": "24/7 Help Desk (L1/L2/L3)", "hi": "24/7 हेल्प डेस्क (L1/L2/L3)"}, "required": false}, {"name": {"ar": "المراقبة عن بعد (RMM)", "de": "Remote Monitoring (RMM)", "en": "Remote Monitoring (RMM)", "hi": "रिमोट मॉनिटरिंग (RMM)"}, "required": false}, {"name": {"ar": "إعداد VPN وجدار الحماية", "de": "VPN- & Firewall-Einrichtung", "en": "VPN & Firewall Setup", "hi": "VPN और फ़ायरवॉल सेटअप"}, "required": false}, {"name": {"ar": "الترحيل والدعم السحابي", "de": "Cloud-Migration & Support", "en": "Cloud Migration & Support", "hi": "क्लाउड माइग्रेशन और सपोर्ट"}, "required": false}, {"name": {"ar": "إدارة الشبكة", "de": "Netzwerkadministration", "en": "Network Administration", "hi": "नेटवर्क एडमिनिस्ट्रेशन"}, "required": false}, {"name": {"ar": "إدارة النسخ الاحتياطي والاستعادة", "de": "Backup- & Restore-Management", "en": "Backup & Restore Management", "hi": "बैकअप और रिस्टोर मैनेजमेंट"}, "required": false}, {"name": {"ar": "تخطيط التعافي من الكوارث", "de": "Disaster-Recovery-Planung", "en": "Disaster Recovery Planning", "hi": "डिज़ास्टर रिकवरी प्लानिंग"}, "required": false}, {"name": {"ar": "إدارة الاستضافة والسيرفر", "de": "Hosting- & Server-Management", "en": "Hosting & Server Management", "hi": "होस्टिंग और सर्वर मैनेजमेंट"}, "required": false}, {"name": {"ar": "ترحيل وترقية الأنظمة", "de": "Systemmigration & Upgrades", "en": "System Migration & Upgrades", "hi": "सिस्टम माइग्रेशन और अपग्रेड"}, "required": false}]	[{"tax": {"rate": 18, "type": "GST", "split": [{"name": "CGST", "rate": 9}, {"name": "SGST", "rate": 9}], "inclusive": false, "registrationNumber": "06AABCU9603R1ZN"}, "unit": "per_hour", "active": true, "cities": ["DEL", "BLR", "MUM", "GGN", "HYD", "PUN"], "country": "IN", "currency": "INR", "basePrice": 1000, "minCharge": 1000, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 5, "type": "VAT", "inclusive": true, "registrationNumber": "100123456700003"}, "unit": "per_hour", "active": true, "cities": ["DXB", "AUH", "SHJ"], "country": "AE", "currency": "AED", "basePrice": 45, "minCharge": 45, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع (الجمعة/السبت)", "de": "Wochenende (Fr/Sa)", "en": "Weekend (Fri/Sat)", "hi": "वीकेंड (शुक्र/शनि)"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [5, 6], "multiplier": 1.15}], "minDuration": 60}, {"tax": {"rate": 19, "type": "VAT", "inclusive": true, "registrationNumber": "DE123456789"}, "unit": "per_hour", "active": true, "cities": ["BER", "MUC", "HAM", "FRA"], "country": "DE", "currency": "EUR", "basePrice": 11, "minCharge": 11, "surgeRules": [{"name": {"ar": "الأحد", "de": "Sonntag", "en": "Sunday", "hi": "रविवार"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0], "multiplier": 1.4}], "minDuration": 60}, {"tax": {"rate": 10, "type": "GST_AU", "inclusive": true, "registrationNumber": "12345678901"}, "unit": "per_hour", "active": true, "cities": ["SYD", "MEL", "BNE", "PER"], "country": "AU", "currency": "AUD", "basePrice": 18, "minCharge": 18, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.2}], "minDuration": 60}, {"tax": {"type": "SALES_TAX", "provider": "taxjar", "inclusive": false, "registrationNumber": "12-3456789"}, "unit": "per_hour", "active": true, "cities": [], "country": "US", "currency": "USD", "basePrice": 12, "minCharge": 12, "surgeRules": [{"name": {"ar": "عطلة نهاية الأسبوع", "de": "Wochenende", "en": "Weekend", "hi": "वीकेंड"}, "active": true, "endHour": 23, "startHour": 0, "daysOfWeek": [0, 6], "multiplier": 1.15}], "minDuration": 60}]	[{"ar": "أوقات استجابة مدعومة بـ SLA", "de": "SLA-abgesicherte Reaktionszeiten", "en": "SLA-backed response times", "hi": "SLA-बैक्ड रिस्पॉन्स टाइम्स"}, {"ar": "دعم متعدد القنوات (دردشة/بريد/هاتف)", "de": "Multi-Channel-Support", "en": "Multi-channel support (chat/email/phone)", "hi": "मल्टी-चैनल सपोर्ट (चैट/ईमेल/फ़ोन)"}, {"ar": "مراقبة استباقية (RMM)", "de": "Proaktives Monitoring (RMM)", "en": "Proactive monitoring (RMM)", "hi": "प्रोएक्टिव मॉनिटरिंग (RMM)"}, {"ar": "التذاكر وأدلة التشغيل مشمولة", "de": "Ticketing & Runbooks inklusive", "en": "Ticketing & runbooks included", "hi": "टिकटिंग और रनबुक शामिल"}]	[{"ar": "الإعداد وجرد الأصول", "de": "Onboarding und Asset-Inventar", "en": "Onboarding and asset inventory", "hi": "ऑनबोर्डिंग और एसेट इन्वेंटरी"}, {"ar": "مكتب مساعدة tier 1 + 2 + 3", "de": "Helpdesk Tier 1 + 2 + 3", "en": "Help desk tier 1 + 2 + 3", "hi": "हेल्प डेस्क tier 1 + 2 + 3"}, {"ar": "إدارة التصحيحات", "de": "Patch-Management", "en": "Patch management", "hi": "पैच मैनेजमेंट"}, {"ar": "تقرير صحة شهري", "de": "Monatlicher Health-Report", "en": "Monthly health report", "hi": "मंथली हेल्थ रिपोर्ट"}]	[{"ar": "شراء الأجهزة", "de": "Hardware-Beschaffung", "en": "Hardware procurement", "hi": "हार्डवेयर खरीदारी"}, {"ar": "زيارات في الموقع (إضافية)", "de": "Vor-Ort-Besuche (extra)", "en": "On-site visits (extra)", "hi": "ऑन-साइट विज़िट (अतिरिक्त)"}]	[{"answer": {"ar": "حرج: 15 دقيقة · مرتفع: ساعة · متوسط: 4 ساعات · منخفض: يوم العمل التالي.", "de": "Kritisch: 15 Min · Hoch: 1 h · Mittel: 4 h · Niedrig: nächster Werktag.", "en": "Critical: 15 min · High: 1 h · Medium: 4 h · Low: next business day.", "hi": "क्रिटिकल: 15 मिनट · हाई: 1 घंटा · मीडियम: 4 घंटे · लो: अगला बिज़नेस डे।"}, "question": {"ar": "ما هو SLA الاستجابة لديكم؟", "de": "Wie ist Ihre Reaktions-SLA?", "en": "What is your response SLA?", "hi": "आपका रिस्पॉन्स SLA क्या है?"}}]	1000	INR	1	24	https://placehold.co/600x400?text=IT%2BSupport	\N	5	t	2026-05-06 14:24:03.818+05:30	2026-05-06 14:24:03.818+05:30
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (_id, user_id, refresh_token_hash, ip, ua, revoked, expires_at, created_at, updated_at) FROM stdin;
69faa69bd86bfbc6283aaad8	69faa69b4e1d6b9cb1e2c7a0	$2a$08$GK8jDvc7Dw35TSdDKaQIp.QKPnDTzX9RQis.i5r7LBi46uFDbumHi	10.29.60.132	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 07:55:31.158+05:30	2026-05-06 07:55:31.158+05:30	2026-05-07 03:00:54.707+05:30
69faa6d6d86bfbc6283aaadc	69faa5134e1d6b9cb1e2c750	$2a$08$x5tn3oSZaEIQpCC0C3Ny6uUmTjznp3.GZv9JejI1Jo8ZbuFbKrO6.	10.29.60.132	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 07:56:30.664+05:30	2026-05-06 07:56:30.664+05:30	2026-05-07 03:00:54.712+05:30
69fabc5d1a4990d361311f1a	69faa69b4e1d6b9cb1e2c7a0	$2a$08$WUb1zeDEgkyNFlrdsFNeBuioAbnBB6pWNjb1Lw9b5rR/Cme4p27Xa	10.25.192.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 09:28:21.275+05:30	2026-05-06 09:28:21.276+05:30	2026-05-07 03:00:54.714+05:30
69facc5231bca016f25fe469	69faa69b4e1d6b9cb1e2c7a0	$2a$08$h/bnVb.KScZ2Lbnz38uL/.Iys/zHfcjuUEgs3P51bAz.xb7FK297y	10.25.235.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 10:36:26.354+05:30	2026-05-06 10:36:26.355+05:30	2026-05-07 03:00:54.715+05:30
69fada67e8408cd6d70ee6af	69fada674e1d6b9cb1e2c7d8	$2a$08$OtFXJxrMkmiunwfzsdEZNefQqi13.2rnYRO0D.Q5wyWPjuykFlJuS	185.177.229.168	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 11:36:31.629+05:30	2026-05-06 11:36:31.629+05:30	2026-05-07 03:00:54.716+05:30
69fadaaae8408cd6d70ee6b2	69faa5134e1d6b9cb1e2c750	$2a$08$qjylFa/ZuYLxELSowDqBvOHSfD/RkGl8ikhmT9J/ga2NzOP7yK.Ju	185.177.229.168	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 11:37:38.839+05:30	2026-05-06 11:37:38.84+05:30	2026-05-07 03:00:54.717+05:30
69fadb49e8408cd6d70ee6be	69fadb494e1d6b9cb1e2c7dd	$2a$08$mQZ6XT33SzDFHYUO7Q3Iu.1XTZZl9kopAK5LXb7hc2QRb0XDpQiXK	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 11:40:17.398+05:30	2026-05-06 11:40:17.398+05:30	2026-05-07 03:00:54.718+05:30
69fadb91e8408cd6d70ee6bf	69fadb914e1d6b9cb1e2c7de	$2a$08$OBzLCJcHpyF5.5VxBnZjE.Kka8e/KJ9IbztI81l6SlhWZ.epVHxJq	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 11:41:29.372+05:30	2026-05-06 11:41:29.373+05:30	2026-05-07 03:00:54.718+05:30
69fae004e8408cd6d70ee6c3	69fae0044e1d6b9cb1e2c7f1	$2a$08$qoNHhDeAxqHFLiwn0rXEGOn.3B1e1G36fe6aXTCVpmw5rw/AQXdmC	185.177.229.168	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:00:28.263+05:30	2026-05-06 12:00:28.263+05:30	2026-05-07 03:00:54.719+05:30
69fae1e570ba1868817afc59	69faa69b4e1d6b9cb1e2c7a0	$2a$08$iqZCngFhepr7X.Rz6nXCRO.QFtcVMzhqIXKzKybAdbs.fIL/p8FnK	10.29.60.132	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:08:29.798+05:30	2026-05-06 12:08:29.799+05:30	2026-05-07 03:00:54.721+05:30
69fae36f4afd78c53a2ced2f	69fae0044e1d6b9cb1e2c7f1	$2a$08$ubj03Y4qi9HI6j0BW7L5LexJOxgV0G1AvkGfSxJLO.EdoRwWuLCjC	10.25.192.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:15:03.759+05:30	2026-05-06 12:15:03.76+05:30	2026-05-07 03:00:54.722+05:30
69fae3c34afd78c53a2ced30	69fae0044e1d6b9cb1e2c7f1	$2a$08$thXTwArpVQ0N6l0jEHoS.eItNy/iXltDkHAzk0oTrfCJ8csT0w5Fu	10.25.192.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:16:27.362+05:30	2026-05-06 12:16:27.363+05:30	2026-05-07 03:00:54.723+05:30
69fae4d14afd78c53a2ced31	69fae0044e1d6b9cb1e2c7f1	$2a$08$Kif5REJv4qhVTxBu2yTTvOQIlwxPOrfuqwVhfdeHM55euKnB9bbKW	10.24.254.4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:20:57.272+05:30	2026-05-06 12:20:57.353+05:30	2026-05-07 03:00:54.724+05:30
69fae57c4afd78c53a2ced32	69faa5134e1d6b9cb1e2c755	$2a$08$M0XxNbhdWJqT770UdJAOieMMnyTLxp46W.DzlNTAPR3xj.4pgQRZy	10.28.39.1	curl/8.7.1	f	2026-06-05 12:23:48.057+05:30	2026-05-06 12:23:48.057+05:30	2026-05-07 03:00:54.725+05:30
69fae5844afd78c53a2ced33	69faa5134e1d6b9cb1e2c755	$2a$08$ott17EJo7W3gswyLHkUz6.y.099uGMmWIu.NmEU1Ez890kU60q8jO	10.30.232.8	curl/8.7.1	f	2026-06-05 12:23:56.663+05:30	2026-05-06 12:23:56.663+05:30	2026-05-07 03:00:54.726+05:30
69fae5b04afd78c53a2ced34	69faa5134e1d6b9cb1e2c755	$2a$08$ul2PQ5Pzhg/05depXgjvIO6qfxuNxOZ.hWrQeEClnjgeSEPfY4fXO	10.28.39.1	curl/8.7.1	f	2026-06-05 12:24:40.157+05:30	2026-05-06 12:24:40.158+05:30	2026-05-07 03:00:54.726+05:30
69fae755295d34e9cc656484	69fae7544e1d6b9cb1e2c7fc	$2a$08$Om52Q2HH9dOvSQ.vLu9.W.TCH44kds2m9kI35Erxhv3qV2nPO6NHi	10.28.39.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:31:41.001+05:30	2026-05-06 12:31:41.002+05:30	2026-05-07 03:00:54.727+05:30
69fae7b8295d34e9cc656486	69faa5134e1d6b9cb1e2c755	$2a$08$9.kZ8iD.JoyzFT1uMC7PjunshxBXhAGR00GxWidb1X6s4u5hybayO	10.29.60.132	curl/8.7.1	f	2026-06-05 12:33:20.613+05:30	2026-05-06 12:33:20.613+05:30	2026-05-07 03:00:54.728+05:30
69fae9dc86202e843ee0da58	69fae9dc4e1d6b9cb1e2c823	$2a$08$p826ORx5RoVy/vtb4snvt.Wo/iY1oRFuFna/6kU4IsHQxg3gKfGF2	10.30.232.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:42:28.7+05:30	2026-05-06 12:42:28.701+05:30	2026-05-07 03:00:54.729+05:30
69faeacc86202e843ee0da59	69faa5134e1d6b9cb1e2c755	$2a$08$nAnwhurBLKWDr61OGEc/i.Xj3.yTeWafWkcip/Sg.8OrGi.T4sfSq	10.24.254.4	curl/8.7.1	f	2026-06-05 12:46:28.204+05:30	2026-05-06 12:46:28.204+05:30	2026-05-07 03:00:54.731+05:30
69faead686202e843ee0da5a	69faa5134e1d6b9cb1e2c755	$2a$08$ZZIjEaB.F4xZDHWuuxejxO7svxpD1Om7hATsh0iX2QCKWX9Z7m5lW	10.25.235.1	curl/8.7.1	f	2026-06-05 12:46:38.203+05:30	2026-05-06 12:46:38.204+05:30	2026-05-07 03:00:54.732+05:30
69faeaea86202e843ee0da5b	69faa5134e1d6b9cb1e2c755	$2a$08$SeWNoJ/00sZeXYAgrkhLL.vpDLGZ1ScmzqyxqDkVrXfc6fqftRMY2	10.25.235.1	curl/8.7.1	f	2026-06-05 12:46:58.409+05:30	2026-05-06 12:46:58.409+05:30	2026-05-07 03:00:54.733+05:30
69faebace98c8a5737e82d9a	69faa5134e1d6b9cb1e2c755	$2a$08$P7xQ27FfDiuqtY3PeSFxiurbJ4sDXgRu01pQAfj8OqeBS4LIM0ACe	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:50:12.748+05:30	2026-05-06 12:50:12.748+05:30	2026-05-07 03:00:54.734+05:30
69faebd1e98c8a5737e82d9b	69faebd14e1d6b9cb1e2c82d	$2a$08$WfmHWXoThdJKyNrMtqHlLuxz3udWZQtpXhPOHynp2pdUX7pRhb.lO	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:50:49.131+05:30	2026-05-06 12:50:49.131+05:30	2026-05-07 03:00:54.736+05:30
69faec1ae98c8a5737e82d9d	69faa5134e1d6b9cb1e2c750	$2a$08$kcib1Nhf3cvcZptEYTDOueTabkOVjPC5BDr5QA4gJDM5vCR2Of5FC	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 12:52:02.692+05:30	2026-05-06 12:52:02.692+05:30	2026-05-07 03:00:54.737+05:30
69faffb3e98c8a5737e82dae	69faa5134e1d6b9cb1e2c750	$2a$08$0Y83YqzKctLYetFimkKOkuZ4beZPQFSknCzBEuj0Cljw/JSLooV3u	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 14:15:39.165+05:30	2026-05-06 14:15:39.165+05:30	2026-05-07 03:00:54.738+05:30
69fb008fe98c8a5737e82daf	69faa69b4e1d6b9cb1e2c7a0	$2a$08$Y4p0wJbExLMkcvNiUQ/FrOcu6C31Ug9b4lGHLAfNr/Vpx19AoseFC	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 14:19:19.349+05:30	2026-05-06 14:19:19.349+05:30	2026-05-07 03:00:54.739+05:30
69fb009be98c8a5737e82db0	69faa5134e1d6b9cb1e2c750	$2a$08$h9Em2N6nTx7jys2QBMlzWenl7jtUforApewgVNBQ5Lo35YD1BLW3u	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 14:19:31.654+05:30	2026-05-06 14:19:31.654+05:30	2026-05-07 03:00:54.741+05:30
69fb0ac676b84ff3211c59ef	69faa5134e1d6b9cb1e2c750	$2a$08$c5FUBt3X77R0QeagiOECs.sOBSfLMa3ob0aulTogBk2z14w6o8nkW	10.26.223.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 15:02:54.744+05:30	2026-05-06 15:02:54.744+05:30	2026-05-07 03:00:54.742+05:30
69fb551ded817c143dc9bf45	69fb51f9a7f979f5e46347d9	$2a$08$t8.8epVP2SpBdidW9neqjueKv4UdQpFsjtx7Jdh4C9JNestqfsNwO	10.30.232.8	curl/8.7.1	f	2026-06-05 20:20:05.236+05:30	2026-05-06 20:20:05.236+05:30	2026-05-07 03:00:54.79+05:30
69fb0c1976b84ff3211c59f0	69faa5134e1d6b9cb1e2c750	$2a$08$AVwB/wrgXhXRY1MCDOtl5uwN1YMF9TD6EjBt0lbcaQ3mOIUYFphGK	10.28.39.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 15:08:33.849+05:30	2026-05-06 15:08:33.85+05:30	2026-05-07 03:00:54.743+05:30
69fb12aee98c8a5737e82db3	69faa5134e1d6b9cb1e2c750	$2a$08$h5gFfamQScNfS03kIiUAXOr9PDZP1oustMEJp0bVqtf/j0VDXQXuK	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 15:36:38.602+05:30	2026-05-06 15:36:38.602+05:30	2026-05-07 03:00:54.745+05:30
69fb12f8e98c8a5737e82db4	69fb12f84e1d6b9cb1e2c8e6	$2a$08$w6UHCRMMeSvRh4cgiHkPFOZXXbEyky9p1C6LpAr9E52uPn8j7FA96	192.168.0.160	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	f	2026-06-05 15:37:52.897+05:30	2026-05-06 15:37:52.897+05:30	2026-05-07 03:00:54.746+05:30
69fb1302d0e19f1b22347220	69faa5134e1d6b9cb1e2c750	$2a$08$qj3qOh5xlDBYjFWP0UwIvu7fHCO57u/AS4js2BveYZRKsv8ho2OSy	10.29.60.132	curl/8.7.1	f	2026-06-05 15:38:02.924+05:30	2026-05-06 15:38:02.925+05:30	2026-05-07 03:00:54.748+05:30
69fb2752e98c8a5737e82dc3	69faa5134e1d6b9cb1e2c756	$2a$08$6XGtWjLb1tjN2bTNUbkv3e758Mv/Ell7lgLFqOhenR8Wypzeqhwme	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 17:04:42.532+05:30	2026-05-06 17:04:42.532+05:30	2026-05-07 03:00:54.749+05:30
69fb27c1e98c8a5737e82dc5	69faa5134e1d6b9cb1e2c750	$2a$08$Iuw4TU1hMXyq3UKy05Bj7OJRcpd6.Zs0TaIgBWV8ezM6DyGbrvQNm	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 17:06:33.323+05:30	2026-05-06 17:06:33.323+05:30	2026-05-07 03:00:54.75+05:30
69fb280ee98c8a5737e82dd0	69faa5134e1d6b9cb1e2c751	$2a$08$RD/4xnJ0DyIXFHdhhdVLSuF6V4qQivdYavplrfIltMeFWt9.PRTyO	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 17:07:50.417+05:30	2026-05-06 17:07:50.417+05:30	2026-05-07 03:00:54.751+05:30
69fb280ee98c8a5737e82dd1	69faa5134e1d6b9cb1e2c751	$2a$08$isDAsPRUql4XUrVY9oa2Huuyk9mh2PLmMPJXq/XAv6kniQW91Lgrq	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 17:07:50.644+05:30	2026-05-06 17:07:50.644+05:30	2026-05-07 03:00:54.752+05:30
69fb286ce98c8a5737e82ddd	69faa5134e1d6b9cb1e2c750	$2a$08$SOyhtaPYWySEx5GVu4/ziuCkW/dlJESSAWlc2h47a2THqPRyn4Xni	192.168.1.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 17:09:24.513+05:30	2026-05-06 17:09:24.513+05:30	2026-05-07 03:00:54.754+05:30
69fb30cfe98c8a5737e82de6	69fb30cf4e1d6b9cb1e2c920	$2a$08$ZD1J2pqGkH9jJo24pPfKa.b11rXGsHIoJynziz0qH47L2CqNB1Zp.	192.168.0.126	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	2026-06-05 17:45:11.158+05:30	2026-05-06 17:45:11.158+05:30	2026-05-07 03:00:54.755+05:30
69fb33f4e98c8a5737e82de7	69fb33f44e1d6b9cb1e2c930	$2a$08$Pn.PpRb3bVh3XuJSKMXaduw7znqUFKcd8Up5EhpZf.owtvrjK.swS	193.108.116.219	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 17:58:36.378+05:30	2026-05-06 17:58:36.378+05:30	2026-05-07 03:00:54.757+05:30
69fb344ae98c8a5737e82ded	69faa5134e1d6b9cb1e2c750	$2a$08$PNI/cW49TUQvOe/S0qQqR.RLPSJAaezgc/FCIRODd3maiz4apMrPi	192.168.0.170	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 18:00:02.962+05:30	2026-05-06 18:00:02.962+05:30	2026-05-07 03:00:54.758+05:30
69fb3472e98c8a5737e82dee	69faa5134e1d6b9cb1e2c751	$2a$08$sJRUZ8aNMq17OFJXg.pim.TnjZGVAMi6qy06VX44XTHIlISK12TVK	192.168.0.170	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 18:00:42.052+05:30	2026-05-06 18:00:42.052+05:30	2026-05-07 03:00:54.76+05:30
69fb3472e98c8a5737e82def	69faa5134e1d6b9cb1e2c751	$2a$08$WhXlGcvYKLWPash1ZZzGXOxlHYKarwmu5pR8v4VBT7n8y8RxV1haS	192.168.0.170	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 18:00:42.257+05:30	2026-05-06 18:00:42.257+05:30	2026-05-07 03:00:54.761+05:30
69fb3481e98c8a5737e82df0	69faa5134e1d6b9cb1e2c752	$2a$08$ltrlnEdKH9XccZfL.dQrteOuc5QrFQ2kRcHjsAja8bWBxNda2q5iq	192.168.0.170	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 18:00:57.459+05:30	2026-05-06 18:00:57.459+05:30	2026-05-07 03:00:54.762+05:30
69fb3526e98c8a5737e82df1	69faa5134e1d6b9cb1e2c752	$2a$08$OmmmIcrNXA.R63hG6MN5WemMdogLzM5wfDh/j.KgeDQ9em5p67226	192.168.0.170	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 18:03:42.064+05:30	2026-05-06 18:03:42.064+05:30	2026-05-07 03:00:54.763+05:30
69fb352fe98c8a5737e82df2	69faa5134e1d6b9cb1e2c750	$2a$08$prQooSEsV3GTlmH0Btxd9esYVmxyWmDyzeHrLwr1e9Clse.UCzqFy	192.168.0.170	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 18:03:51.568+05:30	2026-05-06 18:03:51.568+05:30	2026-05-07 03:00:54.765+05:30
69fb3740e98c8a5737e82df3	69faa5134e1d6b9cb1e2c750	$2a$08$dhHDVztLzgMetpmR6PFwA.c3y10qS41beYy8mO9pvChLYXBblpIoC	192.168.1.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 18:12:40.346+05:30	2026-05-06 18:12:40.346+05:30	2026-05-07 03:00:54.766+05:30
69fb3844e98c8a5737e82dfa	69fb33f44e1d6b9cb1e2c930	$2a$08$bGDczcrHPHCryZtQgeBkpODvOgP4ULOEkSdZhQ2E0S29xnKT32V6.	192.168.1.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 18:17:00.177+05:30	2026-05-06 18:17:00.177+05:30	2026-05-07 03:00:54.768+05:30
69fb4f44602d1c65289185a6	69faa5134e1d6b9cb1e2c750	$2a$08$9rUu0atLTu72Xppdkfkd1OcjAr2PUr7FjzHb.D5w.nRBJf7QdgRJm	10.28.39.1	curl/8.7.1	f	2026-06-05 19:55:08.299+05:30	2026-05-06 19:55:08.3+05:30	2026-05-07 03:00:54.77+05:30
69fb4f4d602d1c65289185a7	69faa5134e1d6b9cb1e2c750	$2a$08$mAp37euxB4ToUWzsho3IzO51H7RnPhUHLPx.8FKAIKDO1JE/Nu.xe	10.28.39.1	curl/8.7.1	f	2026-06-05 19:55:17.5+05:30	2026-05-06 19:55:17.501+05:30	2026-05-07 03:00:54.772+05:30
69fb4f58602d1c65289185a8	69faa5134e1d6b9cb1e2c751	$2a$08$Z5ToNNpBIORrDxAtBnDQyO88KjMt8j.LeqjrLHjjUbydEiGNRXvPm	10.26.223.1	curl/8.7.1	f	2026-06-05 19:55:28.998+05:30	2026-05-06 19:55:28.998+05:30	2026-05-07 03:00:54.773+05:30
69fb518b7208e404c960d0bb	69faa5134e1d6b9cb1e2c750	$2a$08$WyVv6anA8SsBQ9xnz3Eq3.l1XWhgnUHClJWVzrH5uZ83NnSQ/qLrm	10.28.39.1	curl/8.7.1	f	2026-06-05 20:04:51.083+05:30	2026-05-06 20:04:51.083+05:30	2026-05-07 03:00:54.775+05:30
69fb519a7208e404c960d0bc	69faa5134e1d6b9cb1e2c751	$2a$08$J90CTj7w1dy14XjJm2ppn.avJlJ6ADzL9Pt3GCF5xPZ1NyOqdSTUS	10.28.39.1	curl/8.7.1	f	2026-06-05 20:05:06.788+05:30	2026-05-06 20:05:06.789+05:30	2026-05-07 03:00:54.776+05:30
69fb51be7208e404c960d0bd	69faa5134e1d6b9cb1e2c750	$2a$08$157bYecTZkRVo7f06acNqeyO1lBoUFKe33vVNb78wzX7qhd5aU12m	10.25.235.1	curl/8.7.1	f	2026-06-05 20:05:42.684+05:30	2026-05-06 20:05:42.684+05:30	2026-05-07 03:00:54.777+05:30
69fb520b48ffb9e6f9559ee1	69faa5134e1d6b9cb1e2c750	$2a$08$/wgseFiqwtu9/mAhApsQqu5uaN8G2H57.BSxg4.ixe1enEbdyPKDW	10.29.60.132	curl/8.7.1	f	2026-06-05 20:06:59.929+05:30	2026-05-06 20:06:59.929+05:30	2026-05-07 03:00:54.779+05:30
69fb521e48ffb9e6f9559ee3	69fb521e48ffb9e6f9559ee2	$2a$08$6i8XTryR9UbzktmFMaOQsuQUDLmLoM01oABsu1uFNBNe/MgkwXjFO	10.28.39.1	curl/8.7.1	f	2026-06-05 20:07:18.827+05:30	2026-05-06 20:07:18.828+05:30	2026-05-07 03:00:54.78+05:30
69fb54dbed817c143dc9bf3e	69faa5134e1d6b9cb1e2c755	$2a$08$p04rLIfzjcJ8UeLt530Jy.5ynNF7HBtcuO1V6EdQrzUlVPwLutI0q	10.24.254.4	curl/8.7.1	f	2026-06-05 20:18:59.837+05:30	2026-05-06 20:18:59.837+05:30	2026-05-07 03:00:54.781+05:30
69fb54dded817c143dc9bf3f	69faa5134e1d6b9cb1e2c750	$2a$08$xmzY0OmgYzyMYQekNoBxn.SvPZS/kEWhR3LQbpV0tYQ8RRrj.7jtW	10.28.39.1	curl/8.7.1	f	2026-06-05 20:19:01.131+05:30	2026-05-06 20:19:01.132+05:30	2026-05-07 03:00:54.783+05:30
69fb54f1ed817c143dc9bf40	69faa5134e1d6b9cb1e2c751	$2a$08$GmLTwQrVPX4oWXuFVO3kOOHlZD0hy1o83Qh7/t3sfxt/pzB791rw6	10.28.39.1	curl/8.7.1	f	2026-06-05 20:19:21.429+05:30	2026-05-06 20:19:21.429+05:30	2026-05-07 03:00:54.784+05:30
69fb54f3ed817c143dc9bf41	69faa5134e1d6b9cb1e2c752	$2a$08$BsYAfYNlu3kGSCuX95/MI.PuQFVMDBql/EZIN8MoI2eR9f0nNol/.	10.30.232.8	curl/8.7.1	f	2026-06-05 20:19:23.736+05:30	2026-05-06 20:19:23.736+05:30	2026-05-07 03:00:54.786+05:30
69fb54f6ed817c143dc9bf42	69faa5134e1d6b9cb1e2c755	$2a$08$lHdYFfkmRXU.Q773RcAZgufDDUAC19fuh159rruPXqSgC7dCYzYg2	10.30.232.8	curl/8.7.1	f	2026-06-05 20:19:26.223+05:30	2026-05-06 20:19:26.224+05:30	2026-05-07 03:00:54.787+05:30
69fb5507ed817c143dc9bf43	69faa5134e1d6b9cb1e2c755	$2a$08$0WtFg9rtOQwiAcTkySzrBuXzB7lTo1BzFINkVr4ybHCX2hTaR4p1y	10.28.39.1	curl/8.7.1	f	2026-06-05 20:19:43.132+05:30	2026-05-06 20:19:43.132+05:30	2026-05-07 03:00:54.789+05:30
69fb551eed817c143dc9bf46	69fb51f9a7f979f5e46347da	$2a$08$UCeLqYI06eNFVaqmwm81IOjwJ6TChuaaAw3j2t/CZBm/4tVe4Jp8m	10.25.192.1	curl/8.7.1	f	2026-06-05 20:20:06.931+05:30	2026-05-06 20:20:06.931+05:30	2026-05-07 03:00:54.79+05:30
69fb5520ed817c143dc9bf47	69fb51f9a7f979f5e46347db	$2a$08$B.GvKBcRbUJe4hVUMB7Z1uETHETfXm1hkPKbd8mz8pHO.3kul5dki	10.30.232.8	curl/8.7.1	f	2026-06-05 20:20:08.43+05:30	2026-05-06 20:20:08.43+05:30	2026-05-07 03:00:54.791+05:30
69fb5522ed817c143dc9bf48	69fb51f9a7f979f5e46347dc	$2a$08$qRenem1TPg8FSDUJ6Fw9HOu95FUDLOYOq.HfsPS1EMMPD7xs5p4m6	10.27.254.3	curl/8.7.1	f	2026-06-05 20:20:10.127+05:30	2026-05-06 20:20:10.127+05:30	2026-05-07 03:00:54.792+05:30
69fb5523ed817c143dc9bf49	69fb51f9a7f979f5e46347dd	$2a$08$ZEx4PnK24alqWOwk1vvvu.0B7.wOQ.lQVf/7LlDln6Ox8jnUBWUP6	10.28.39.1	curl/8.7.1	f	2026-06-05 20:20:11.625+05:30	2026-05-06 20:20:11.625+05:30	2026-05-07 03:00:54.793+05:30
69fb5525ed817c143dc9bf4a	69fb51f9a7f979f5e46347d9	$2a$08$rkHR2F225qekXEz1MMbeOOSaJVAwshZAQnp9Of4gfyFPNjQiPjTBO	10.25.192.1	curl/8.7.1	f	2026-06-05 20:20:13.223+05:30	2026-05-06 20:20:13.223+05:30	2026-05-07 03:00:54.794+05:30
69fb5526ed817c143dc9bf4b	69faa5134e1d6b9cb1e2c750	$2a$08$ucRRFzPINPZXcqcnviUvhOb4bAEv/vFFmdaRWE0m/tuFsNWLICfqy	10.29.60.132	curl/8.7.1	f	2026-06-05 20:20:14.525+05:30	2026-05-06 20:20:14.526+05:30	2026-05-07 03:00:54.795+05:30
69fb55dced817c143dc9bf4c	69faa5134e1d6b9cb1e2c750	$2a$08$qWqejRc5jIdkA5QfXfs1NuQv9sSNF7chsYLM9DcheMLaeemXFx8yW	10.25.235.1	curl/8.7.1	f	2026-06-05 20:23:16.825+05:30	2026-05-06 20:23:16.825+05:30	2026-05-07 03:00:54.796+05:30
69fb55eded817c143dc9bf4d	69fb51f9a7f979f5e46347d9	$2a$08$xIYx4LGrqeqvQa5kDy46r.KV7G2VhHEV4dvE2uSRpirti.G3Tmk/.	10.25.192.1	curl/8.7.1	f	2026-06-05 20:23:33.224+05:30	2026-05-06 20:23:33.224+05:30	2026-05-07 03:00:54.797+05:30
69fb55efed817c143dc9bf4e	69faa5134e1d6b9cb1e2c750	$2a$08$adjUAzjsM8R27kMIS4lWYuYt/YstkFI3R8yJIEbIiEKmfZ2oZ6B6u	10.27.254.3	curl/8.7.1	f	2026-06-05 20:23:35.323+05:30	2026-05-06 20:23:35.323+05:30	2026-05-07 03:00:54.798+05:30
69fb5a90855b96aaea155ff6	69faa5134e1d6b9cb1e2c750	$2a$08$5tqfiNdXFBRWlnmBq..V1OyerhVnDdpN46kcw1QTTQZxdIZMnjS7O	10.29.60.132	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 20:43:20.332+05:30	2026-05-06 20:43:20.333+05:30	2026-05-07 03:00:54.799+05:30
69fb5ae3855b96aaea155ff7	69fb51f9a7f979f5e46347d9	$2a$08$jmCHU2hGjguGeELIPK2xeOayTJunI5VeLdblJyhe/pikfWnej/.Zm	10.29.60.132	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 20:44:43.64+05:30	2026-05-06 20:44:43.64+05:30	2026-05-07 03:00:54.799+05:30
69fb5af5855b96aaea155ff8	69fb51f9a7f979f5e46347d9	$2a$08$.77aD.adurcK6aPT9VJnEObfB5F1ztcL5q3pQxS7YmPXumsp2eUKS	10.29.60.132	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 20:45:01.941+05:30	2026-05-06 20:45:01.941+05:30	2026-05-07 03:00:54.8+05:30
69fb5b01855b96aaea155ffa	69fb5b01855b96aaea155ff9	$2a$08$BCT9dvpHbwwScPxs6.XfcePFG4FNZan8uhrFVZk6kMvfc7klBtqNG	10.27.254.3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 20:45:13.636+05:30	2026-05-06 20:45:13.636+05:30	2026-05-07 03:00:54.801+05:30
69fb5b1a855b96aaea155ffb	69faa5134e1d6b9cb1e2c751	$2a$08$X9clXYkAmxW127oqQ3ushemE3dSiOIbtln1r7VzvPKVB4c5BSrFfi	10.28.39.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 20:45:38.435+05:30	2026-05-06 20:45:38.436+05:30	2026-05-07 03:00:54.802+05:30
69fb5b9e855b96aaea155ffd	69fb5b9e855b96aaea155ffc	$2a$08$Up1u.i7iEMTBB4a/n3ymj.yXNEdiD1NlWDjoHQkIoHrbeU/jlxc82	10.29.60.132	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 20:47:50.433+05:30	2026-05-06 20:47:50.433+05:30	2026-05-07 03:00:54.803+05:30
69fb5cc5b4a11c1413187171	69faa5134e1d6b9cb1e2c750	$2a$08$DwFtiXjGU/TfoH9SwlZmOeB4EQuCe3LReCdhtScTpuvSRlJH6d5XK	10.24.254.4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 20:52:45.737+05:30	2026-05-06 20:52:45.737+05:30	2026-05-07 03:00:54.804+05:30
69fb73e8e98c8a5737e82e18	69fb33f44e1d6b9cb1e2c930	$2a$08$AAprkCH3od0LGgF88V4ZquX7cGqrBodGYQroChW1F5MYmcM4C./Zu	163.223.102.213	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 22:31:28.045+05:30	2026-05-06 22:31:28.045+05:30	2026-05-07 03:00:54.805+05:30
69fb78e1e98c8a5737e82e1c	69fb78e12b307b985b3cbde9	$2a$08$Hzwh/GPqdg2nObXBb/v0TeTIACvUMnshYbygNemYYwgFAUKC3wE0G	45.118.156.43	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 22:52:41.298+05:30	2026-05-06 22:52:41.298+05:30	2026-05-07 03:00:54.806+05:30
69fb7d0be98c8a5737e82e1d	69fb7d0b2b307b985b3cbdea	$2a$08$ket6mYJzYWz3QsBamxVIzuT9sHwgGrQY7XCXw/HuKzg/dScejEJce	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	2026-06-05 23:10:27.794+05:30	2026-05-06 23:10:27.795+05:30	2026-05-07 03:00:54.808+05:30
69fb7d54e98c8a5737e82e1e	69fb7d0b2b307b985b3cbdea	$2a$08$pXuL2BvyEhMX7aBpyDo8BuUDGJtIiUKRLPiBXGeBG1r6uJ.dHKafW	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	2026-06-05 23:11:40.709+05:30	2026-05-06 23:11:40.709+05:30	2026-05-07 03:00:54.809+05:30
69fb7d9be98c8a5737e82e1f	69fb7d9b2b307b985b3cbdeb	$2a$08$nM3Y/DtlZNfRDmu0qhiF5uWjBztguaYqtU2ysHzDxWC0HVEO6G/0e	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 23:12:51.428+05:30	2026-05-06 23:12:51.428+05:30	2026-05-07 03:00:54.81+05:30
69fb7eb5e98c8a5737e82e20	69fb7eb52b307b985b3cbdec	$2a$08$M2DnhRNYWOpRkeB2sKSx8ebxcTVov5mjXSn/GfFfXy7ARq8n9wh2C	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 23:17:33.197+05:30	2026-05-06 23:17:33.197+05:30	2026-05-07 03:00:54.811+05:30
69fb7edce98c8a5737e82e21	69fb7edc2b307b985b3cbded	$2a$08$7Zd/bw9EdX5bPFo8gFI8Y.q6N6PQblYebFPa2fpFmVWKFYnfBkblC	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 23:18:12.631+05:30	2026-05-06 23:18:12.631+05:30	2026-05-07 03:00:54.812+05:30
69fb7ef5e98c8a5737e82e22	69fb7ef52b307b985b3cbdee	$2a$08$f/V8Uf6oxRrJPpC8PAZZWu3s7qKCTmLoxTfGhgvnaaiq2h7yxEKwy	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 23:18:37.919+05:30	2026-05-06 23:18:37.919+05:30	2026-05-07 03:00:54.813+05:30
69fb7f02e98c8a5737e82e23	69fb7ef52b307b985b3cbdee	$2a$08$4jhnesdHCA7AW9pwKboI1OrWASc1V8LZn935ZydmQMMQ30ssuGPGG	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 23:18:50.538+05:30	2026-05-06 23:18:50.538+05:30	2026-05-07 03:00:54.814+05:30
69fb7f1ce98c8a5737e82e24	69fb7ef52b307b985b3cbdee	$2a$08$y392jg62QVmZcrUkEHgGwOlW7KRtGm6HTiEFXK/KTiRuxncn2z.yC	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	2026-06-05 23:19:16.963+05:30	2026-05-06 23:19:16.963+05:30	2026-05-07 03:00:54.815+05:30
69fb7fbae98c8a5737e82e25	69fb7fba2b307b985b3cbdef	$2a$08$L/x.McMhSzqEun930ttSme/FKhjeA8zaxNtF0za8YMfCkplyOXYnG	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	2026-06-05 23:21:54.337+05:30	2026-05-06 23:21:54.337+05:30	2026-05-07 03:00:54.816+05:30
69fb8482e98c8a5737e82e26	69fb84812b307b985b3cbdf1	$2a$08$RLNISjuYuUTKb4L5zUWun.9/EwfLuVatr1rV4Ab43RXKJ2vet3p1O	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	2026-06-05 23:42:18.001+05:30	2026-05-06 23:42:18.001+05:30	2026-05-07 03:00:54.818+05:30
69fb86f1e98c8a5737e82e27	69fb86f12b307b985b3cbdf9	$2a$08$a8UyUTwoiX6S/4r/6vskJ.F6.iUP/iZ4n/S.1qrMspsZglfofxKqS	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-05 23:52:41.951+05:30	2026-05-06 23:52:41.951+05:30	2026-05-07 03:00:54.819+05:30
69fb8b6ae98c8a5737e82e28	69fb7d0b2b307b985b3cbdea	$2a$08$MvpQidhudfp29CWlDradD.6Bf4kyef0a7ig6MCzaIFw2ab6UD2CCq	157.49.44.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	2026-06-06 00:11:46.56+05:30	2026-05-07 00:11:46.56+05:30	2026-05-07 03:00:54.82+05:30
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_config (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa5154e1d6b9cb1e2c780	{"_id": "69faa5154e1d6b9cb1e2c780", "key": "platform_fee_pct", "value": 18, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "Platform fee % applied to all bookings"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c781	{"_id": "69faa5154e1d6b9cb1e2c781", "key": "gst_pct", "value": 18, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "GST % on all transactions"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c782	{"_id": "69faa5154e1d6b9cb1e2c782", "key": "min_booking_hours", "value": 4, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "Minimum hours per booking"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c783	{"_id": "69faa5154e1d6b9cb1e2c783", "key": "max_booking_hours", "value": 40, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "Maximum hours per booking"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c784	{"_id": "69faa5154e1d6b9cb1e2c784", "key": "allocation_sla_minutes", "value": 10, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "SLA to allocate a resource after booking (mins)"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5154e1d6b9cb1e2c785	{"_id": "69faa5154e1d6b9cb1e2c785", "key": "refund_window_hours", "value": 24, "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "Hours after booking start within which refund is allowed"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c786	{"_id": "69faa5164e1d6b9cb1e2c786", "key": "support_email", "value": "support@quickhire.services", "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "Customer support email"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c787	{"_id": "69faa5164e1d6b9cb1e2c787", "key": "support_phone", "value": "+91-9000000000", "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "Customer support phone"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
69faa5164e1d6b9cb1e2c788	{"_id": "69faa5164e1d6b9cb1e2c788", "key": "currency_default", "value": "INR", "createdAt": "2026-05-06T02:18:56.927Z", "updatedAt": "2026-05-06T07:07:01.458Z", "description": "Default currency"}	\N	\N	\N	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 12:37:01.458+05:30
\.


--
-- Data for Name: ticket_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_messages (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa51624729f95617814e7	{"_id": "69faa51624729f95617814e7", "message": "Hi, I tried to extend my React Developer booking but got an error.", "senderId": "69faa5134e1d6b9cb1e2c755", "ticketId": "69faa51624729f95617814e6", "createdAt": "2026-04-28T02:19:02.913Z", "senderRole": "user"}	\N	\N	\N	\N	\N	2026-04-28 07:49:02.913+05:30	\N
69faa51624729f95617814e8	{"_id": "69faa51624729f95617814e8", "message": "Thanks for reaching out! We have resolved the extension issue. Please try again.", "senderId": "69faa5134e1d6b9cb1e2c750", "ticketId": "69faa51624729f95617814e6", "createdAt": "2026-04-29T02:19:02.942Z", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-04-29 07:49:02.942+05:30	\N
69fae89c75ed7035320450d9	{"_id": "69fae89c75ed7035320450d9", "message": "Hi, I tried to extend my React Developer booking but got an error.", "senderId": "69faa5134e1d6b9cb1e2c755", "ticketId": "69fae89c75ed7035320450d8", "createdAt": "2026-04-28T07:07:08.708Z", "senderRole": "user"}	\N	\N	\N	\N	\N	2026-04-28 12:37:08.708+05:30	\N
69fae89c75ed7035320450da	{"_id": "69fae89c75ed7035320450da", "message": "Thanks for reaching out! We have resolved the extension issue. Please try again.", "senderId": "69faa5134e1d6b9cb1e2c750", "ticketId": "69fae89c75ed7035320450d8", "createdAt": "2026-04-29T07:07:08.844Z", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-04-29 12:37:08.844+05:30	\N
69fb2912e98c8a5737e82de0	{"_id": "69fb2912e98c8a5737e82de0", "msg": "hello", "senderId": "69faa5134e1d6b9cb1e2c750", "ticketId": "69fae89c75ed7035320450d8", "createdAt": "2026-05-06T11:42:10.800Z", "senderRole": "admin"}	\N	\N	\N	\N	\N	2026-05-06 17:12:10.8+05:30	\N
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tickets (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
69faa51624729f95617814e6	{"_id": "69faa51624729f95617814e6", "status": "resolved", "userId": "69faa5134e1d6b9cb1e2c755", "subject": "Issue with booking extension", "category": "billing", "priority": "medium", "createdAt": "2026-04-28T02:19:02.884Z", "updatedAt": "2026-04-29T02:19:02.884Z", "resolvedAt": "2026-04-29T02:19:02.884Z"}	\N	resolved	69faa5134e1d6b9cb1e2c755	\N	\N	2026-04-28 07:49:02.884+05:30	2026-04-29 07:49:02.884+05:30
69fae89c75ed7035320450d8	{"_id": "69fae89c75ed7035320450d8", "status": "resolved", "userId": "69faa5134e1d6b9cb1e2c755", "subject": "Issue with booking extension", "category": "billing", "priority": "medium", "createdAt": "2026-04-28T07:07:08.663Z", "updatedAt": "2026-04-29T07:07:08.663Z", "resolvedAt": "2026-04-29T07:07:08.663Z"}	\N	resolved	69faa5134e1d6b9cb1e2c755	\N	\N	2026-04-28 12:37:08.663+05:30	2026-04-29 12:37:08.663+05:30
\.


--
-- Data for Name: tips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tips (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.translations (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (_id, mobile, email, name, role, country, parent_country_admin_id, managed_countries, fcm_tokens, specialization, skills, meta, history, deleted_at, created_at, updated_at) FROM stdin;
69faa5134e1d6b9cb1e2c750	9000000000	admin@quickhire.local	Root Admin	super_admin	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T15:22:45.649Z", "isProfileComplete": true}	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 20:52:45.649+05:30
69faa5134e1d6b9cb1e2c751	9000000001	pm@quickhire.local	Priya Sharma	pm	IN	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T15:15:38.295Z", "isProfileComplete": true}	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 20:45:38.295+05:30
69faa5134e1d6b9cb1e2c752	9000000002	arjun@quickhire.local	Arjun Mehta	resource	DE	\N	\N	\N	\N	["react", "node", "typescript", "mongodb"]	{"status": "active", "lastLoginAt": "2026-05-06T14:49:23.622Z", "isProfileComplete": true}	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 20:19:23.622+05:30
69faa5134e1d6b9cb1e2c753	9000000003	sneha@quickhire.local	Sneha Patel	resource	IN	\N	\N	\N	\N	["flutter", "dart", "firebase", "kotlin"]	{"status": "active", "isProfileComplete": true}	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 19:38:44.596+05:30
69faa5134e1d6b9cb1e2c754	9000000004	rahul@quickhire.local	Rahul Verma	resource	IN	\N	\N	\N	\N	["aws", "docker", "kubernetes", "terraform", "devops"]	{"status": "active", "isProfileComplete": true}	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 19:38:44.653+05:30
69faa5134e1d6b9cb1e2c755	9876543210	testuser@example.com	Test Customer	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T14:49:43.017Z", "isProfileComplete": true}	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 20:19:43.017+05:30
69faa5134e1d6b9cb1e2c756	9876543211	demo@example.com	Demo User	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T11:34:42.476Z", "isProfileComplete": true}	\N	\N	2026-05-06 07:48:56.927+05:30	2026-05-06 17:04:42.476+05:30
69faa69b4e1d6b9cb1e2c7a0	+919351779913	shreay012@gmail.com	Shreay Goyal	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T08:49:19.273Z", "isProfileComplete": true}	\N	\N	2026-05-06 07:55:31.029+05:30	2026-05-06 14:19:19.273+05:30
69fada674e1d6b9cb1e2c7d8	9876542312	234565@fdgd.com	876543214567865432	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T06:06:31.575Z", "isProfileComplete": true}	\N	\N	2026-05-06 11:36:31.575+05:30	2026-05-06 11:36:44.935+05:30
69fadb494e1d6b9cb1e2c7dd	+919876542312	23@GMAIL.COM	ERWTFGYUH765	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T06:10:17.344Z", "isProfileComplete": true}	\N	\N	2026-05-06 11:40:17.344+05:30	2026-05-06 11:40:28.159+05:30
69fadb914e1d6b9cb1e2c7de	+918796543245	SHREAY001@GMAIL.COM	ASDFF	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T06:11:29.330Z", "isProfileComplete": true}	\N	\N	2026-05-06 11:41:29.33+05:30	2026-05-06 11:41:43.303+05:30
69fae0044e1d6b9cb1e2c7f1	+919876543210	sg@123.com	SHREAY NEW	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T06:50:57.172Z", "isProfileComplete": true}	\N	\N	2026-05-06 12:00:28.204+05:30	2026-05-06 12:20:57.172+05:30
69fae7544e1d6b9cb1e2c7fc	+919351779914	shreay012@gma.COM	Shreay Goyal	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T07:01:40.890Z", "isProfileComplete": true}	\N	\N	2026-05-06 12:31:40.89+05:30	2026-05-06 12:32:10.606+05:30
69fae9dc4e1d6b9cb1e2c823	+919876543213	dd@sdf.com	erw	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T07:12:28.514Z", "isProfileComplete": true}	\N	\N	2026-05-06 12:42:28.514+05:30	2026-05-06 12:43:00.332+05:30
69faebd14e1d6b9cb1e2c82d	9876543456	fdego3@DD.COM	111wddsf	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T07:20:49.090Z", "isProfileComplete": true}	\N	\N	2026-05-06 12:50:49.09+05:30	2026-05-06 12:51:01.615+05:30
69fb12f84e1d6b9cb1e2c8e6	8750833489	rajeshjayraj007@gmail.com	Rajesh kumar thakur	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T10:07:52.855Z", "isProfileComplete": true}	\N	\N	2026-05-06 15:37:52.855+05:30	2026-05-06 15:37:58.473+05:30
69fb30cf4e1d6b9cb1e2c920	+911234567890	ayush@gmail.com	ayush	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T12:15:11.097Z", "isProfileComplete": true}	\N	\N	2026-05-06 17:45:11.097+05:30	2026-05-06 17:45:21.582+05:30
69fb33f44e1d6b9cb1e2c930	1234567890	test@gmail.com	test	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T17:01:27.985Z", "isProfileComplete": true}	\N	\N	2026-05-06 17:58:36.32+05:30	2026-05-06 22:31:27.985+05:30
69fb3985e98c8a5737e82e0e	9876543567	\N	skjshaxdciwuds	resource	IN	\N	\N	\N	[]	[]	{"status": "active", "isProfileComplete": true}	\N	\N	2026-05-06 18:22:21.819+05:30	2026-05-06 19:38:44.709+05:30
69fb51f9a7f979f5e46347d9	9000000010	in-admin@quickhire.services	India Operations Lead	country_admin	IN	\N	["IN"]	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T15:15:01.808Z", "isProfileComplete": true}	\N	\N	2026-05-06 20:06:41.012+05:30	2026-05-06 20:45:01.808+05:30
69fb51f9a7f979f5e46347da	9000000020	ae-admin@quickhire.services	UAE Operations Lead	country_admin	AE	\N	["AE"]	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T14:50:06.798Z", "isProfileComplete": true}	\N	\N	2026-05-06 20:06:41.012+05:30	2026-05-06 20:20:06.798+05:30
69fb51f9a7f979f5e46347db	9000000030	de-admin@quickhire.services	Germany Operations Lead	country_admin	DE	\N	["DE"]	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T14:50:08.304Z", "isProfileComplete": true}	\N	\N	2026-05-06 20:06:41.012+05:30	2026-05-06 20:20:08.304+05:30
69fb51f9a7f979f5e46347dc	9000000040	au-admin@quickhire.services	Australia Operations Lead	country_admin	AU	\N	["AU"]	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T14:50:09.911Z", "isProfileComplete": true}	\N	\N	2026-05-06 20:06:41.012+05:30	2026-05-06 20:20:09.911+05:30
69fb51f9a7f979f5e46347dd	9000000050	us-admin@quickhire.services	USA Operations Lead	country_admin	US	\N	["US"]	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T14:50:11.498Z", "isProfileComplete": true}	\N	\N	2026-05-06 20:06:41.012+05:30	2026-05-06 20:20:11.498+05:30
69fb78e12b307b985b3cbde9	+917677363472	mysterious5994@gmail.com	fcdfghjk	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T17:22:41.228Z", "isProfileComplete": true}	\N	\N	2026-05-06 22:52:41.228+05:30	2026-05-06 22:52:57.231+05:30
69fb7d0b2b307b985b3cbdea	+917011525363	test876r65667@gmail.com	test	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T18:41:46.507Z", "isProfileComplete": true}	\N	\N	2026-05-06 23:10:27.737+05:30	2026-05-07 00:11:46.507+05:30
69fb7d9b2b307b985b3cbdeb	+918976556787	\N	\N	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T17:42:51.375Z", "isProfileComplete": false}	\N	\N	2026-05-06 23:12:51.375+05:30	2026-05-06 23:12:51.375+05:30
69fb7eb52b307b985b3cbdec	+917987655768	\N	\N	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T17:47:33.146Z", "isProfileComplete": false}	\N	\N	2026-05-06 23:17:33.146+05:30	2026-05-06 23:17:33.146+05:30
69fb7edc2b307b985b3cbded	+918909676787	\N	\N	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T17:48:12.591Z", "isProfileComplete": false}	\N	\N	2026-05-06 23:18:12.591+05:30	2026-05-06 23:18:12.591+05:30
69fb7ef52b307b985b3cbdee	+912345678900	\N	\N	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T17:49:16.920Z", "isProfileComplete": false}	\N	\N	2026-05-06 23:18:37.879+05:30	2026-05-06 23:19:16.92+05:30
69fb7fba2b307b985b3cbdef	+918766768767	\N	\N	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T17:51:54.292Z", "isProfileComplete": false}	\N	\N	2026-05-06 23:21:54.292+05:30	2026-05-06 23:21:54.292+05:30
69fb84812b307b985b3cbdf1	9089765678	\N	\N	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T18:12:17.941Z", "isProfileComplete": false}	\N	\N	2026-05-06 23:42:17.941+05:30	2026-05-06 23:42:17.941+05:30
69fb86f12b307b985b3cbdf9	7011525363	test3636@gmail.com	test	user	\N	\N	\N	\N	\N	\N	{"status": "active", "lastLoginAt": "2026-05-06T18:22:41.901Z", "isProfileComplete": true}	\N	\N	2026-05-06 23:52:41.901+05:30	2026-05-06 23:52:52.937+05:30
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (_id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (_id);


--
-- Name: booking_histories booking_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_histories
    ADD CONSTRAINT booking_histories_pkey PRIMARY KEY (_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (_id);


--
-- Name: chat chat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat
    ADD CONSTRAINT chat_pkey PRIMARY KEY (_id);


--
-- Name: chatbot_logs chatbot_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_logs
    ADD CONSTRAINT chatbot_logs_pkey PRIMARY KEY (_id);


--
-- Name: cms_articles cms_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_articles
    ADD CONSTRAINT cms_articles_pkey PRIMARY KEY (_id);


--
-- Name: cms_banners cms_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_banners
    ADD CONSTRAINT cms_banners_pkey PRIMARY KEY (_id);


--
-- Name: cms_content cms_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_content
    ADD CONSTRAINT cms_content_pkey PRIMARY KEY (_id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (_id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (_id);


--
-- Name: fcm_tokens fcm_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_pkey PRIMARY KEY (_id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (_id);


--
-- Name: fx_rates fx_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_rates
    ADD CONSTRAINT fx_rates_pkey PRIMARY KEY (_id);


--
-- Name: geo_pricing geo_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_pricing
    ADD CONSTRAINT geo_pricing_pkey PRIMARY KEY (_id);


--
-- Name: idempotency idempotency_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency
    ADD CONSTRAINT idempotency_pkey PRIMARY KEY (_id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (_id);


--
-- Name: legal_acceptances legal_acceptances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_acceptances
    ADD CONSTRAINT legal_acceptances_pkey PRIMARY KEY (_id);


--
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (_id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (_id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (_id);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (_id);


--
-- Name: promo_redemptions promo_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_redemptions
    ADD CONSTRAINT promo_redemptions_pkey PRIMARY KEY (_id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (_id);


--
-- Name: reschedule_history reschedule_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reschedule_history
    ADD CONSTRAINT reschedule_history_pkey PRIMARY KEY (_id);


--
-- Name: resource_deliverables resource_deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_deliverables
    ADD CONSTRAINT resource_deliverables_pkey PRIMARY KEY (_id);


--
-- Name: resource_time_logs resource_time_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_time_logs
    ADD CONSTRAINT resource_time_logs_pkey PRIMARY KEY (_id);


--
-- Name: resource_work_updates resource_work_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_work_updates
    ADD CONSTRAINT resource_work_updates_pkey PRIMARY KEY (_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (_id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (_id);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (_id);


--
-- Name: ticket_messages ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (_id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (_id);


--
-- Name: tips tips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tips
    ADD CONSTRAINT tips_pkey PRIMARY KEY (_id);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (_id);


--
-- Name: audit_logs_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_country_idx ON public.audit_logs USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at DESC);


--
-- Name: audit_logs_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_data_gin ON public.audit_logs USING gin (data jsonb_path_ops);


--
-- Name: audit_logs_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_pm_idx ON public.audit_logs USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: audit_logs_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_resource_idx ON public.audit_logs USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: audit_logs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_status_idx ON public.audit_logs USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: audit_logs_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_idx ON public.audit_logs USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: blog_posts_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_country_idx ON public.blog_posts USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: blog_posts_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_created_at_idx ON public.blog_posts USING btree (created_at DESC);


--
-- Name: blog_posts_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_data_gin ON public.blog_posts USING gin (data jsonb_path_ops);


--
-- Name: blog_posts_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_pm_idx ON public.blog_posts USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: blog_posts_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_resource_idx ON public.blog_posts USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: blog_posts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_status_idx ON public.blog_posts USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: blog_posts_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_user_idx ON public.blog_posts USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: booking_histories_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_histories_country_idx ON public.booking_histories USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: booking_histories_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_histories_created_at_idx ON public.booking_histories USING btree (created_at DESC);


--
-- Name: booking_histories_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_histories_data_gin ON public.booking_histories USING gin (data jsonb_path_ops);


--
-- Name: booking_histories_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_histories_pm_idx ON public.booking_histories USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: booking_histories_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_histories_resource_idx ON public.booking_histories USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: booking_histories_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_histories_status_idx ON public.booking_histories USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: booking_histories_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_histories_user_idx ON public.booking_histories USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: bookings_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_country_idx ON public.bookings USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: bookings_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_created_at_idx ON public.bookings USING btree (created_at DESC);


--
-- Name: bookings_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_data_gin ON public.bookings USING gin (data jsonb_path_ops);


--
-- Name: bookings_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_pm_idx ON public.bookings USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: bookings_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_resource_idx ON public.bookings USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: bookings_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_user_idx ON public.bookings USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: chat_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_country_idx ON public.chat USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: chat_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_created_at_idx ON public.chat USING btree (created_at DESC);


--
-- Name: chat_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_data_gin ON public.chat USING gin (data jsonb_path_ops);


--
-- Name: chat_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_pm_idx ON public.chat USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: chat_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_resource_idx ON public.chat USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: chat_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_status_idx ON public.chat USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: chat_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_user_idx ON public.chat USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: chatbot_logs_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chatbot_logs_country_idx ON public.chatbot_logs USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: chatbot_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chatbot_logs_created_at_idx ON public.chatbot_logs USING btree (created_at DESC);


--
-- Name: chatbot_logs_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chatbot_logs_data_gin ON public.chatbot_logs USING gin (data jsonb_path_ops);


--
-- Name: chatbot_logs_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chatbot_logs_pm_idx ON public.chatbot_logs USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: chatbot_logs_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chatbot_logs_resource_idx ON public.chatbot_logs USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: chatbot_logs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chatbot_logs_status_idx ON public.chatbot_logs USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: chatbot_logs_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chatbot_logs_user_idx ON public.chatbot_logs USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: cms_articles_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_articles_country_idx ON public.cms_articles USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: cms_articles_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_articles_created_at_idx ON public.cms_articles USING btree (created_at DESC);


--
-- Name: cms_articles_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_articles_data_gin ON public.cms_articles USING gin (data jsonb_path_ops);


--
-- Name: cms_articles_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_articles_pm_idx ON public.cms_articles USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: cms_articles_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_articles_resource_idx ON public.cms_articles USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: cms_articles_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_articles_status_idx ON public.cms_articles USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: cms_articles_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_articles_user_idx ON public.cms_articles USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: cms_banners_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_banners_country_idx ON public.cms_banners USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: cms_banners_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_banners_created_at_idx ON public.cms_banners USING btree (created_at DESC);


--
-- Name: cms_banners_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_banners_data_gin ON public.cms_banners USING gin (data jsonb_path_ops);


--
-- Name: cms_banners_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_banners_pm_idx ON public.cms_banners USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: cms_banners_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_banners_resource_idx ON public.cms_banners USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: cms_banners_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_banners_status_idx ON public.cms_banners USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: cms_banners_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_banners_user_idx ON public.cms_banners USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: cms_content_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_content_country_idx ON public.cms_content USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: cms_content_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_content_created_at_idx ON public.cms_content USING btree (created_at DESC);


--
-- Name: cms_content_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_content_data_gin ON public.cms_content USING gin (data jsonb_path_ops);


--
-- Name: cms_content_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_content_pm_idx ON public.cms_content USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: cms_content_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_content_resource_idx ON public.cms_content USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: cms_content_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_content_status_idx ON public.cms_content USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: cms_content_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_content_user_idx ON public.cms_content USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: countries_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX countries_active_idx ON public.countries USING btree (active);


--
-- Name: countries_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX countries_code_unique ON public.countries USING btree (code);


--
-- Name: currencies_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX currencies_code_unique ON public.currencies USING btree (code);


--
-- Name: fcm_tokens_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fcm_tokens_country_idx ON public.fcm_tokens USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: fcm_tokens_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fcm_tokens_created_at_idx ON public.fcm_tokens USING btree (created_at DESC);


--
-- Name: fcm_tokens_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fcm_tokens_data_gin ON public.fcm_tokens USING gin (data jsonb_path_ops);


--
-- Name: fcm_tokens_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fcm_tokens_pm_idx ON public.fcm_tokens USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: fcm_tokens_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fcm_tokens_resource_idx ON public.fcm_tokens USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: fcm_tokens_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fcm_tokens_status_idx ON public.fcm_tokens USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: fcm_tokens_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fcm_tokens_user_idx ON public.fcm_tokens USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: feature_flags_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_flags_country_idx ON public.feature_flags USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: feature_flags_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_flags_created_at_idx ON public.feature_flags USING btree (created_at DESC);


--
-- Name: feature_flags_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_flags_data_gin ON public.feature_flags USING gin (data jsonb_path_ops);


--
-- Name: feature_flags_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_flags_pm_idx ON public.feature_flags USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: feature_flags_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_flags_resource_idx ON public.feature_flags USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: feature_flags_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_flags_status_idx ON public.feature_flags USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: feature_flags_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_flags_user_idx ON public.feature_flags USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: fx_rates_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fx_rates_country_idx ON public.fx_rates USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: fx_rates_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fx_rates_created_at_idx ON public.fx_rates USING btree (created_at DESC);


--
-- Name: fx_rates_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fx_rates_data_gin ON public.fx_rates USING gin (data jsonb_path_ops);


--
-- Name: fx_rates_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fx_rates_pm_idx ON public.fx_rates USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: fx_rates_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fx_rates_resource_idx ON public.fx_rates USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: fx_rates_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fx_rates_status_idx ON public.fx_rates USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: fx_rates_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fx_rates_user_idx ON public.fx_rates USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: geo_pricing_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geo_pricing_country_idx ON public.geo_pricing USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: geo_pricing_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geo_pricing_created_at_idx ON public.geo_pricing USING btree (created_at DESC);


--
-- Name: geo_pricing_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geo_pricing_data_gin ON public.geo_pricing USING gin (data jsonb_path_ops);


--
-- Name: geo_pricing_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geo_pricing_pm_idx ON public.geo_pricing USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: geo_pricing_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geo_pricing_resource_idx ON public.geo_pricing USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: geo_pricing_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geo_pricing_status_idx ON public.geo_pricing USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: geo_pricing_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geo_pricing_user_idx ON public.geo_pricing USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idempotency_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idempotency_country_idx ON public.idempotency USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: idempotency_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idempotency_created_at_idx ON public.idempotency USING btree (created_at DESC);


--
-- Name: idempotency_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idempotency_data_gin ON public.idempotency USING gin (data jsonb_path_ops);


--
-- Name: idempotency_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idempotency_pm_idx ON public.idempotency USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: idempotency_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idempotency_resource_idx ON public.idempotency USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: idempotency_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idempotency_status_idx ON public.idempotency USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: idempotency_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idempotency_user_idx ON public.idempotency USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: jobs_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_country_idx ON public.jobs USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: jobs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_created_at_idx ON public.jobs USING btree (created_at DESC);


--
-- Name: jobs_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_data_gin ON public.jobs USING gin (data jsonb_path_ops);


--
-- Name: jobs_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_pm_idx ON public.jobs USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: jobs_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_resource_idx ON public.jobs USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: jobs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_status_idx ON public.jobs USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: jobs_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_user_idx ON public.jobs USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: legal_acceptances_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_acceptances_country_idx ON public.legal_acceptances USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: legal_acceptances_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_acceptances_created_at_idx ON public.legal_acceptances USING btree (created_at DESC);


--
-- Name: legal_acceptances_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_acceptances_data_gin ON public.legal_acceptances USING gin (data jsonb_path_ops);


--
-- Name: legal_acceptances_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_acceptances_pm_idx ON public.legal_acceptances USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: legal_acceptances_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_acceptances_resource_idx ON public.legal_acceptances USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: legal_acceptances_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_acceptances_status_idx ON public.legal_acceptances USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: legal_acceptances_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_acceptances_user_idx ON public.legal_acceptances USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: legal_documents_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_documents_country_idx ON public.legal_documents USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: legal_documents_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_documents_created_at_idx ON public.legal_documents USING btree (created_at DESC);


--
-- Name: legal_documents_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_documents_data_gin ON public.legal_documents USING gin (data jsonb_path_ops);


--
-- Name: legal_documents_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_documents_pm_idx ON public.legal_documents USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: legal_documents_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_documents_resource_idx ON public.legal_documents USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: legal_documents_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_documents_status_idx ON public.legal_documents USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: legal_documents_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_documents_user_idx ON public.legal_documents USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: messages_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_country_idx ON public.messages USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: messages_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at DESC);


--
-- Name: messages_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_data_gin ON public.messages USING gin (data jsonb_path_ops);


--
-- Name: messages_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_pm_idx ON public.messages USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: messages_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_resource_idx ON public.messages USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: messages_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_status_idx ON public.messages USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: messages_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_user_idx ON public.messages USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: notification_templates_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_templates_country_idx ON public.notification_templates USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: notification_templates_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_templates_created_at_idx ON public.notification_templates USING btree (created_at DESC);


--
-- Name: notification_templates_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_templates_data_gin ON public.notification_templates USING gin (data jsonb_path_ops);


--
-- Name: notification_templates_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_templates_pm_idx ON public.notification_templates USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: notification_templates_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_templates_resource_idx ON public.notification_templates USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: notification_templates_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_templates_status_idx ON public.notification_templates USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: notification_templates_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_templates_user_idx ON public.notification_templates USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: notifications_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_country_idx ON public.notifications USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at DESC);


--
-- Name: notifications_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_data_gin ON public.notifications USING gin (data jsonb_path_ops);


--
-- Name: notifications_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_pm_idx ON public.notifications USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: notifications_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_resource_idx ON public.notifications USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: notifications_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_status_idx ON public.notifications USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: notifications_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_idx ON public.notifications USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: payments_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_country_idx ON public.payments USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: payments_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_created_at_idx ON public.payments USING btree (created_at DESC);


--
-- Name: payments_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_data_gin ON public.payments USING gin (data jsonb_path_ops);


--
-- Name: payments_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_pm_idx ON public.payments USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: payments_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_resource_idx ON public.payments USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: payments_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_user_idx ON public.payments USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: payouts_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payouts_country_idx ON public.payouts USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: payouts_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payouts_created_at_idx ON public.payouts USING btree (created_at DESC);


--
-- Name: payouts_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payouts_data_gin ON public.payouts USING gin (data jsonb_path_ops);


--
-- Name: payouts_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payouts_pm_idx ON public.payouts USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: payouts_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payouts_resource_idx ON public.payouts USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: payouts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payouts_status_idx ON public.payouts USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: payouts_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payouts_user_idx ON public.payouts USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: promo_codes_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_codes_country_idx ON public.promo_codes USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: promo_codes_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_codes_created_at_idx ON public.promo_codes USING btree (created_at DESC);


--
-- Name: promo_codes_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_codes_data_gin ON public.promo_codes USING gin (data jsonb_path_ops);


--
-- Name: promo_codes_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_codes_pm_idx ON public.promo_codes USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: promo_codes_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_codes_resource_idx ON public.promo_codes USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: promo_codes_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_codes_status_idx ON public.promo_codes USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: promo_codes_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_codes_user_idx ON public.promo_codes USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: promo_redemptions_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_redemptions_country_idx ON public.promo_redemptions USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: promo_redemptions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_redemptions_created_at_idx ON public.promo_redemptions USING btree (created_at DESC);


--
-- Name: promo_redemptions_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_redemptions_data_gin ON public.promo_redemptions USING gin (data jsonb_path_ops);


--
-- Name: promo_redemptions_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_redemptions_pm_idx ON public.promo_redemptions USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: promo_redemptions_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_redemptions_resource_idx ON public.promo_redemptions USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: promo_redemptions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_redemptions_status_idx ON public.promo_redemptions USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: promo_redemptions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_redemptions_user_idx ON public.promo_redemptions USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: refunds_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refunds_country_idx ON public.refunds USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: refunds_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refunds_created_at_idx ON public.refunds USING btree (created_at DESC);


--
-- Name: refunds_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refunds_data_gin ON public.refunds USING gin (data jsonb_path_ops);


--
-- Name: refunds_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refunds_pm_idx ON public.refunds USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: refunds_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refunds_resource_idx ON public.refunds USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: refunds_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refunds_status_idx ON public.refunds USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: refunds_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refunds_user_idx ON public.refunds USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: reschedule_history_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reschedule_history_country_idx ON public.reschedule_history USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: reschedule_history_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reschedule_history_created_at_idx ON public.reschedule_history USING btree (created_at DESC);


--
-- Name: reschedule_history_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reschedule_history_data_gin ON public.reschedule_history USING gin (data jsonb_path_ops);


--
-- Name: reschedule_history_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reschedule_history_pm_idx ON public.reschedule_history USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: reschedule_history_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reschedule_history_resource_idx ON public.reschedule_history USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: reschedule_history_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reschedule_history_status_idx ON public.reschedule_history USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: reschedule_history_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reschedule_history_user_idx ON public.reschedule_history USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: resource_deliverables_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_deliverables_country_idx ON public.resource_deliverables USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: resource_deliverables_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_deliverables_created_at_idx ON public.resource_deliverables USING btree (created_at DESC);


--
-- Name: resource_deliverables_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_deliverables_data_gin ON public.resource_deliverables USING gin (data jsonb_path_ops);


--
-- Name: resource_deliverables_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_deliverables_pm_idx ON public.resource_deliverables USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: resource_deliverables_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_deliverables_resource_idx ON public.resource_deliverables USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: resource_deliverables_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_deliverables_status_idx ON public.resource_deliverables USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: resource_deliverables_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_deliverables_user_idx ON public.resource_deliverables USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: resource_time_logs_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_time_logs_country_idx ON public.resource_time_logs USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: resource_time_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_time_logs_created_at_idx ON public.resource_time_logs USING btree (created_at DESC);


--
-- Name: resource_time_logs_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_time_logs_data_gin ON public.resource_time_logs USING gin (data jsonb_path_ops);


--
-- Name: resource_time_logs_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_time_logs_pm_idx ON public.resource_time_logs USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: resource_time_logs_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_time_logs_resource_idx ON public.resource_time_logs USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: resource_time_logs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_time_logs_status_idx ON public.resource_time_logs USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: resource_time_logs_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_time_logs_user_idx ON public.resource_time_logs USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: resource_work_updates_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_work_updates_country_idx ON public.resource_work_updates USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: resource_work_updates_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_work_updates_created_at_idx ON public.resource_work_updates USING btree (created_at DESC);


--
-- Name: resource_work_updates_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_work_updates_data_gin ON public.resource_work_updates USING gin (data jsonb_path_ops);


--
-- Name: resource_work_updates_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_work_updates_pm_idx ON public.resource_work_updates USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: resource_work_updates_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_work_updates_resource_idx ON public.resource_work_updates USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: resource_work_updates_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_work_updates_status_idx ON public.resource_work_updates USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: resource_work_updates_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_work_updates_user_idx ON public.resource_work_updates USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: reviews_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_country_idx ON public.reviews USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: reviews_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_created_at_idx ON public.reviews USING btree (created_at DESC);


--
-- Name: reviews_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_data_gin ON public.reviews USING gin (data jsonb_path_ops);


--
-- Name: reviews_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_pm_idx ON public.reviews USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: reviews_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_resource_idx ON public.reviews USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: reviews_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_status_idx ON public.reviews USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: reviews_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_user_idx ON public.reviews USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: services_active_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX services_active_category_idx ON public.services USING btree (active, category);


--
-- Name: services_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX services_slug_unique ON public.services USING btree (slug);


--
-- Name: sessions_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_expires_idx ON public.sessions USING btree (expires_at);


--
-- Name: sessions_user_revoked_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_revoked_idx ON public.sessions USING btree (user_id, revoked);


--
-- Name: system_config_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_config_country_idx ON public.system_config USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: system_config_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_config_created_at_idx ON public.system_config USING btree (created_at DESC);


--
-- Name: system_config_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_config_data_gin ON public.system_config USING gin (data jsonb_path_ops);


--
-- Name: system_config_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_config_pm_idx ON public.system_config USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: system_config_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_config_resource_idx ON public.system_config USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: system_config_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_config_status_idx ON public.system_config USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: system_config_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_config_user_idx ON public.system_config USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: ticket_messages_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_country_idx ON public.ticket_messages USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: ticket_messages_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_created_at_idx ON public.ticket_messages USING btree (created_at DESC);


--
-- Name: ticket_messages_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_data_gin ON public.ticket_messages USING gin (data jsonb_path_ops);


--
-- Name: ticket_messages_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_pm_idx ON public.ticket_messages USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: ticket_messages_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_resource_idx ON public.ticket_messages USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: ticket_messages_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_status_idx ON public.ticket_messages USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: ticket_messages_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_user_idx ON public.ticket_messages USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: tickets_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_country_idx ON public.tickets USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: tickets_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_created_at_idx ON public.tickets USING btree (created_at DESC);


--
-- Name: tickets_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_data_gin ON public.tickets USING gin (data jsonb_path_ops);


--
-- Name: tickets_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_pm_idx ON public.tickets USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: tickets_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_resource_idx ON public.tickets USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: tickets_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_status_idx ON public.tickets USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: tickets_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_user_idx ON public.tickets USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: tips_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tips_country_idx ON public.tips USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: tips_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tips_created_at_idx ON public.tips USING btree (created_at DESC);


--
-- Name: tips_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tips_data_gin ON public.tips USING gin (data jsonb_path_ops);


--
-- Name: tips_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tips_pm_idx ON public.tips USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: tips_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tips_resource_idx ON public.tips USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: tips_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tips_status_idx ON public.tips USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: tips_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tips_user_idx ON public.tips USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: translations_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_country_idx ON public.translations USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: translations_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_created_at_idx ON public.translations USING btree (created_at DESC);


--
-- Name: translations_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_data_gin ON public.translations USING gin (data jsonb_path_ops);


--
-- Name: translations_pm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_pm_idx ON public.translations USING btree (pm_id) WHERE (pm_id IS NOT NULL);


--
-- Name: translations_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_resource_idx ON public.translations USING btree (resource_id) WHERE (resource_id IS NOT NULL);


--
-- Name: translations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_status_idx ON public.translations USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: translations_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_user_idx ON public.translations USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: users_country_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_country_status_idx ON public.users USING btree (country);


--
-- Name: users_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: users_mobile_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_mobile_unique ON public.users USING btree (mobile) WHERE (mobile IS NOT NULL);


--
-- Name: users_role_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_country_idx ON public.users USING btree (role, country);


--
-- PostgreSQL database dump complete
--

\unrestrict NoUcpRdsZSdPwk0ud28DUOztftz6gOIAZ6g49Mwlv9TJ3CPzSQDI0hndLnafDjs

