## Purpose

Decides whether a room can be held for a given arrival and departure date, which
is the single question the whole booking flow depends on, and defines exactly how
the two ends of a stay are counted.

## ADDED Requirements

### Requirement: A stay occupies its arrival night up to its departure day

A stay SHALL occupy every night from its arrival date up to, but not including,
its departure date. The departure day SHALL be free for a new arrival: a stay
that ends on day X and a stay that begins on day X do not overlap.

#### Scenario: New arrival on a departing stay's last day

- **GIVEN** a confirmed reservation for a room from 20 October to 23 October
- **WHEN** availability is checked for that room from 23 October to 25 October
- **THEN** the room is reported available and no conflicting reservation is
  counted

#### Scenario: New departure on an arriving stay's first day

- **GIVEN** a confirmed reservation for a room from 23 October to 25 October
- **WHEN** availability is checked for that room from 21 October to 23 October
- **THEN** the room is reported available and no conflicting reservation is
  counted

#### Scenario: Ranges that share a night

- **GIVEN** a confirmed reservation for a room from 20 October to 23 October
- **WHEN** availability is checked for that room from 22 October to 24 October
- **THEN** the room is reported unavailable and the overlapping reservation is
  counted as a conflict

#### Scenario: Requested range contains an existing stay

- **GIVEN** a confirmed reservation for a room from 21 October to 22 October
- **WHEN** availability is checked for that room from 20 October to 25 October
- **THEN** the room is reported unavailable

#### Scenario: Requested range sits entirely before an existing stay

- **GIVEN** a confirmed reservation for a room from 20 October to 23 October
- **WHEN** availability is checked for that room from 14 October to 17 October
- **THEN** the room is reported available

### Requirement: Cancelled stays never block a room

The system SHALL count only reservations that are still in force when deciding
availability, and SHALL ignore cancelled reservations entirely.

#### Scenario: Cancelled reservation on the requested nights

- **GIVEN** a reservation for a room from 20 October to 23 October that has been
  cancelled
- **WHEN** availability is checked for that room from 21 October to 22 October
- **THEN** the room is reported available

### Requirement: Availability requests are validated

The system SHALL reject an availability request whose departure date is not
later than its arrival date, whose dates are not valid calendar dates, whose
arrival date is in the past, or whose guest count exceeds the room's maximum
occupancy, and SHALL answer with status 400 and a message naming the offending
field.

#### Scenario: Departure before arrival

- **GIVEN** an availability request with a departure date earlier than its
  arrival date
- **WHEN** the request is sent
- **THEN** the response has status 400 and names the departure date as invalid

#### Scenario: Same arrival and departure date

- **GIVEN** an availability request whose arrival and departure dates are equal
- **WHEN** the request is sent
- **THEN** the response has status 400, because a stay covers at least one night

#### Scenario: Too many guests

- **GIVEN** a room with a maximum occupancy of two
- **WHEN** availability is checked for that room for three guests
- **THEN** the response has status 400 and names the guest count as exceeding the
  room's maximum occupancy

### Requirement: Availability answers carry the nights and the conflict count

The system SHALL answer an availability check with the room, the requested
arrival and departure dates, the number of nights, whether the room is
available, and how many reservations in force conflict with the request.

#### Scenario: Available room

- **GIVEN** a room with no reservation over the requested nights
- **WHEN** availability is checked
- **THEN** the response has status 200, reports the room available, reports zero
  conflicts, and reports the number of nights between arrival and departure

#### Scenario: Unavailable room

- **GIVEN** a room with one reservation in force over the requested nights
- **WHEN** availability is checked
- **THEN** the response has status 200, reports the room unavailable and reports
  one conflict

### Requirement: The room list reflects availability when dates are given

The system SHALL, when the guest supplies arrival and departure dates while
browsing, show only rooms that are available for those dates.

#### Scenario: Browsing with dates

- **GIVEN** a guest browsing the room list with arrival and departure dates
  chosen
- **WHEN** the list is rendered
- **THEN** every room shown is available for those dates, and a room whose only
  reservation ends on the chosen arrival date is among them
