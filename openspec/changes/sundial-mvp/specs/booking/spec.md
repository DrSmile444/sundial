## Purpose

Turns a guest's choice of room and dates into a held reservation paid at the
property, through a quote the guest can read and a confirmation that produces
exactly one reservation.

## ADDED Requirements

### Requirement: A quote records the guest's booking intent

The system SHALL, on request, price a stay for a room, a date range and a guest
count, record that intent, and return an intent identifier together with the
price breakdown: nightly rate, number of nights, room subtotal, taxes and fees,
and total payable at the property.

#### Scenario: Quote for an available room

- **GIVEN** a room available for the requested dates
- **WHEN** a quote is requested for that room, date range and guest count
- **THEN** the response has status 200 and carries a booking intent identifier,
  the nightly rate, the number of nights, the subtotal, the taxes and fees and
  the total

#### Scenario: Quote arithmetic

- **GIVEN** a room at a nightly rate over a three-night stay
- **WHEN** a quote is requested
- **THEN** the subtotal equals the nightly rate multiplied by three, the total
  equals the subtotal plus taxes and fees, and every amount is returned in minor
  currency units with its currency code

#### Scenario: Quote for an unavailable room

- **GIVEN** a room that is not available for the requested dates
- **WHEN** a quote is requested
- **THEN** the response has status 409, states that the room is unavailable, and
  no booking intent is recorded

### Requirement: One booking intent yields at most one reservation

The system SHALL create at most one reservation for a given booking intent,
however many confirmation requests arrive for that intent and however closely
they arrive together. A repeated confirmation of an intent SHALL return the
reservation already created for it, with the same reference, rather than
creating another.

#### Scenario: Single confirmation

- **GIVEN** a booking intent for an available room
- **WHEN** the guest confirms the booking once
- **THEN** the response has status 201, carries a reservation reference, and
  exactly one reservation exists for that intent

#### Scenario: Repeated confirmation

- **GIVEN** a booking intent that has already been confirmed
- **WHEN** a further confirmation request for the same intent arrives
- **THEN** the response carries the reference of the reservation already created,
  and the number of reservations for that intent is still one

#### Scenario: Simultaneous confirmations

- **GIVEN** a booking intent for an available room
- **WHEN** two confirmation requests for that intent are sent at the same moment
- **THEN** both responses carry the same reservation reference, and exactly one
  reservation exists for that intent

#### Scenario: Confirm control cannot be used twice

- **GIVEN** a guest on the booking page with a priced quote
- **WHEN** the guest activates the confirm control and activates it again before
  the response arrives
- **THEN** only one confirmation request is sent, and the control shows that the
  booking is in progress until the page navigates

### Requirement: Two reservations in force never share a night in one room

The system SHALL refuse a confirmation whose nights are already held by a
reservation in force for the same room, whether the conflict is present when the
quote is priced or appears between the quote and the confirmation.

#### Scenario: Room taken between quote and confirmation

- **GIVEN** a booking intent priced while the room was available
- **WHEN** the room's nights have since been reserved and the guest confirms
- **THEN** the response has status 409, states that the room is no longer
  available, and no reservation is created for that intent

#### Scenario: Two guests confirm the same nights

- **GIVEN** two booking intents from different guests for the same room and the
  same nights
- **WHEN** both are confirmed at the same moment
- **THEN** exactly one confirmation succeeds, the other answers 409, and the room
  holds one reservation for those nights

### Requirement: A confirmation captures the guest and stays payable at the property

The system SHALL require a guest full name, email address and phone number to
confirm a booking, SHALL reject a confirmation whose email address is not
well-formed, and SHALL record every reservation as payable at the property with
no payment collected online.

#### Scenario: Guest details are required

- **GIVEN** a booking intent and a confirmation request missing the guest email
  address
- **WHEN** the request is sent
- **THEN** the response has status 400 and names the missing field, and no
  reservation is created

#### Scenario: Reservation is payable at the property

- **GIVEN** a successful confirmation
- **WHEN** the reservation is read back
- **THEN** it records the total payable at the property and carries no payment
  instrument, card data or online payment status

### Requirement: A reference identifies a reservation to its guest

The system SHALL give every reservation a reference that is unique across the
property, is safe to read aloud, and is shown to the guest on the confirmation
page together with the room, the dates, the guest count and the total payable.

#### Scenario: Confirmation page

- **GIVEN** a reservation just created
- **WHEN** the guest is taken to the confirmation page
- **THEN** the page shows the reference, the room name, the arrival and departure
  dates, the guest count, the total payable at the property, and how to manage
  the reservation later

#### Scenario: References do not repeat

- **GIVEN** many reservations created in succession
- **WHEN** their references are compared
- **THEN** every reference is distinct
