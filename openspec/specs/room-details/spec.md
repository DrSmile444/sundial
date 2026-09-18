# room-details Specification

## Purpose

Ensures a room's detail page and API resource respond successfully and show
a placeholder image whenever that room's stored gallery data does not carry
a valid list of images, regardless of the data's historical shape.

## Requirements

### Requirement: Room detail renders for any stored gallery shape

The room detail page and its underlying API resource SHALL respond
successfully for every room in the catalogue regardless of the shape of that
room's stored gallery data, treating a gallery without a valid list of
images as having zero images rather than failing the request.

#### Scenario: Room detail API tolerates a gallery without an images list

- **GIVEN** a room whose stored gallery data has no `images` array (for
  example, a single `primary` URL and `caption` instead of a list)
- **WHEN** a client requests that room's detail resource
- **THEN** the response has status 200 and carries an empty list of gallery
  images, along with the room's name, description, nightly rate, amenities
  and review summary

#### Scenario: Room detail page renders for a room without gallery images

- **GIVEN** a room whose stored gallery data has no valid `images` array
- **WHEN** that room's detail page is opened
- **THEN** the page responds with status 200 and shows no error page

### Requirement: Missing gallery images show a placeholder

The room detail page SHALL show a placeholder in the lead image position
when a room has zero gallery images, instead of omitting that part of the
layout.

#### Scenario: Lead image slot shows a placeholder for a room without images

- **GIVEN** a room with zero gallery images
- **WHEN** that room's detail page is opened
- **THEN** the page shows the lead image position as an empty placeholder,
  the same empty state the room list card already shows for a room with no
  primary image
