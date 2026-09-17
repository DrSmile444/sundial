## Purpose

Makes every request the application serves answerable after the fact: what was
asked, what was answered, how long it took, which release served it, and which
correlation id ties the browser, the log and any error record together.

## ADDED Requirements

### Requirement: Every API request carries a request id

The system SHALL give every API request a request id, SHALL adopt a well-formed
`x-request-id` supplied by the caller instead of generating one, SHALL return
the id in the `x-request-id` response header, and SHALL carry the same id in
every log line and error record produced while handling that request.

#### Scenario: Request without an id

- **GIVEN** an API request that carries no `x-request-id` header
- **WHEN** the request is handled
- **THEN** the response carries a newly generated `x-request-id`, and the log
  line for that request carries the same value

#### Scenario: Request with an id

- **GIVEN** an API request carrying a well-formed `x-request-id`
- **WHEN** the request is handled
- **THEN** the response returns that same id, and the log line for the request
  carries it

#### Scenario: Browser-originated request

- **GIVEN** a guest using the site
- **WHEN** the page calls the API
- **THEN** the request carries an `x-request-id` the page generated, and any
  error recorded on the page during that interaction carries the same id

### Requirement: Every API request writes one structured log line

The system SHALL write exactly one JSON log line per API request, carrying the
timestamp, the level, the request id, the HTTP method, the route pattern, the
response status, the duration in milliseconds, the number of database queries
executed, the release identifier, and the business identifiers the route works
with. The lines SHALL be written to standard output and appended to
`logs/app.ndjson`, one JSON object per line.

#### Scenario: Successful request

- **GIVEN** an API request that completes with a 2xx status
- **WHEN** its log line is read
- **THEN** the line has level `info` and carries timestamp, request id, method,
  route, status, duration, database query count and release, together with the
  business identifiers of that route such as room slug, arrival and departure
  dates, booking intent identifier or reservation reference

#### Scenario: Failed request

- **GIVEN** an API request that ends with a 5xx status or an unhandled error
- **WHEN** its log line is read
- **THEN** the line has level `error`, carries an error name or code and the call
  stack, and carries the same request id as the error record sent to error
  tracking

#### Scenario: One line per request

- **GIVEN** a sequence of API requests
- **WHEN** the log file is read
- **THEN** it holds exactly one line per request, each line is a single valid
  JSON object, and no request is logged twice

#### Scenario: Personal data is absent

- **GIVEN** any log line the system writes
- **WHEN** it is inspected
- **THEN** it carries no guest email address, phone number, full name, payment
  detail or secret, and identifies guests only by reservation reference or
  booking intent identifier

### Requirement: Error tracking is configured and inert without a DSN

The system SHALL initialise error tracking on the server and in the browser,
SHALL tag every event with the environment, the release identifier, the request
id and the route, and SHALL make no network call and raise no error when no DSN
is configured.

#### Scenario: DSN configured

- **GIVEN** a DSN present in the environment
- **WHEN** an unhandled error occurs while serving a request
- **THEN** an event is recorded carrying the environment, the release, the
  request id, the route and a call stack resolved to the project's source

#### Scenario: DSN absent

- **GIVEN** no DSN in the environment
- **WHEN** the application starts and serves requests, including one that raises
  an unhandled error
- **THEN** the application behaves as it does with a DSN configured, makes no
  network call to the error-tracking service, and still writes the error log line
  with its call stack

### Requirement: The release identifier is present everywhere

The system SHALL derive its release identifier from the git commit it was built
from, and SHALL report the same value on the health endpoint, in every log line
and on every error event.

#### Scenario: Health endpoint

- **GIVEN** a running application
- **WHEN** the health endpoint is called
- **THEN** the response has status 200 and carries the service status, the
  release identifier and whether the database is reachable

#### Scenario: Release matches the build

- **GIVEN** an application built from a known git commit
- **WHEN** the health response and any request log line are compared
- **THEN** both report that commit's short hash as the release identifier

#### Scenario: Database unreachable

- **GIVEN** an application whose database cannot be reached
- **WHEN** the health endpoint is called
- **THEN** the response has status 503 and reports the database as unreachable
  while still carrying the release identifier

### Requirement: The repository documents where evidence lives

The repository SHALL carry a response runbook at `docs/incident-response.md`
that leads an engineer from a guest-visible symptom to the request log, the
error-tracking configuration, the database and the reproduction tooling, and
then through reproduction, a regression test, a fix, verification and a written
root-cause analysis.

#### Scenario: Engineer follows the runbook

- **GIVEN** an engineer new to the repository and a guest-visible symptom
- **WHEN** the engineer follows the runbook alone
- **THEN** the engineer can locate the request log file, the error-tracking
  configuration, the database connection command and the browser tooling without
  asking anyone

#### Scenario: Correlating a symptom

- **GIVEN** a request id taken from a response header
- **WHEN** the runbook's correlation steps are followed
- **THEN** the matching log line and, where error tracking is configured, the
  matching error event are found
