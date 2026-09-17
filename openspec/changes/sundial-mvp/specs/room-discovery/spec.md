## Purpose

Lets a guest find a room worth staying in: the catalogue of rooms the property
offers, the filters that narrow it, and the sort orders that reorder it, all
answering fast enough to feel instant while browsing.

## ADDED Requirements

### Requirement: Room list returns the published catalogue

The system SHALL return every published room in the catalogue, each with its
slug, name, short description, nightly rate, maximum occupancy, primary image
and average guest rating.

#### Scenario: Catalogue is listed

- **GIVEN** the catalogue holds published rooms
- **WHEN** a client requests the room list
- **THEN** the response has status 200 and contains one entry per published
  room, each carrying slug, name, short description, nightly rate, maximum
  occupancy, primary image and average rating

#### Scenario: Room list is rendered

- **GIVEN** a guest opens `/rooms`
- **WHEN** the page has loaded
- **THEN** one card is shown for each room in the response, and each card links
  to that room's detail page

### Requirement: Room list can be filtered

The system SHALL narrow the room list by guest count, by nightly rate range and
by amenity, combining every supplied filter conjunctively, and SHALL return an
empty list rather than an error when no room matches.

#### Scenario: Filter by guest count

- **GIVEN** the catalogue holds rooms with maximum occupancy of two and of four
- **WHEN** a client requests the room list for four guests
- **THEN** every room in the response has a maximum occupancy of four or more

#### Scenario: Filters combine

- **GIVEN** a guest has selected an amenity and a maximum nightly rate
- **WHEN** the room list is requested
- **THEN** every room in the response offers that amenity and costs no more than
  that rate per night

#### Scenario: No room matches

- **GIVEN** filters that no room satisfies
- **WHEN** the room list is requested
- **THEN** the response has status 200 with an empty list, and the page shows an
  empty-state message inviting the guest to widen the search

### Requirement: Room list can be sorted

The system SHALL order the room list by one of `recommended` (the default),
`price` (ascending nightly rate) and `top-rated` (descending average guest
rating), and SHALL apply the sort to the whole filtered set rather than to a
page of it.

#### Scenario: Sort by price

- **GIVEN** the catalogue holds rooms at different nightly rates
- **WHEN** a client requests the room list sorted by `price`
- **THEN** the response lists rooms in ascending order of nightly rate

#### Scenario: Sort by rating

- **GIVEN** rooms carry guest reviews
- **WHEN** a client requests the room list sorted by `top-rated`
- **THEN** the response lists rooms in descending order of average guest rating

#### Scenario: Unknown sort value

- **GIVEN** a sort value the system does not offer
- **WHEN** the room list is requested
- **THEN** the response has status 400 and names the accepted sort values

#### Scenario: Sort control re-requests the list

- **GIVEN** a guest is on `/rooms`
- **WHEN** the guest changes the sort control
- **THEN** the page issues a new room-list request carrying the chosen sort and
  a fresh request id, and re-renders the cards in the returned order

### Requirement: Every sort answers within the same response-time budget

The system SHALL answer a room-list request within the same response-time budget
whichever sort is selected, and SHALL execute a number of database queries that
does not grow with the number of rooms returned.

#### Scenario: Sorts are compared

- **GIVEN** a catalogue of the production size with its full review history
- **WHEN** the room list is requested once per available sort value
- **THEN** every response completes within the documented budget, and no sort is
  materially slower than the default

#### Scenario: Query count does not grow with the result size

- **GIVEN** a room-list request that returns many rooms
- **WHEN** the request log line for it is read
- **THEN** its database query count is the same as for a request returning few
  rooms
