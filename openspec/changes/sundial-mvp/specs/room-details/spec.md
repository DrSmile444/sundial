## Purpose

Gives a guest everything needed to choose one particular room: its images, its
story, what it includes, what past guests said, and the way from there into the
booking flow.

## ADDED Requirements

### Requirement: A room page renders for every room in the catalogue

The system SHALL render a detail page for every room the catalogue lists, and
SHALL render it fully whatever the age or shape of that room's stored gallery
data.

#### Scenario: Every catalogue room opens

- **GIVEN** the room list returned by the catalogue
- **WHEN** each listed room's detail page is opened in turn
- **THEN** every page responds with status 200 and renders the room name,
  description, gallery, amenities and review summary, with no error page shown

#### Scenario: Room detail API answers for every room

- **GIVEN** the slug of any room in the catalogue
- **WHEN** a client requests that room's detail resource
- **THEN** the response has status 200 and carries the room's name, long
  description, nightly rate, maximum occupancy, amenities, gallery images and
  review summary

#### Scenario: Gallery is normalised for display

- **GIVEN** a room whose stored gallery data is in any shape the catalogue has
  ever written
- **WHEN** that room's detail resource is requested
- **THEN** the response carries an ordered list of gallery images, each with a
  URL and an alternative text, and the first image is the room's primary image

#### Scenario: Unknown slug

- **GIVEN** a slug that matches no room
- **WHEN** the detail page is opened
- **THEN** the system shows its not-found page with status 404, and the detail
  API answers 404 with an error payload

### Requirement: Room page shows amenities and review summary

The system SHALL show, for each room, the amenities attached to it and a summary
of its guest reviews consisting of the average rating, the number of reviews and
the most recent reviews.

#### Scenario: Room with reviews

- **GIVEN** a room that has guest reviews
- **WHEN** its detail page is rendered
- **THEN** the page shows the average rating to one decimal place, the total
  number of reviews, and the most recent reviews with their rating, date and
  text

#### Scenario: Room without reviews

- **GIVEN** a room that has no guest reviews
- **WHEN** its detail page is rendered
- **THEN** the page shows that the room is not yet reviewed, and shows no average
  rating

### Requirement: Room page leads into booking

The system SHALL offer, on every room detail page, a booking panel carrying the
nightly rate and a control that opens the booking flow for that room, preserving
any dates and guest count the guest has already chosen.

#### Scenario: Guest starts booking from a room page

- **GIVEN** a guest on a room detail page who has entered arrival and departure
  dates
- **WHEN** the guest activates the booking control
- **THEN** the booking page for that room opens with the same dates and guest
  count already filled in
