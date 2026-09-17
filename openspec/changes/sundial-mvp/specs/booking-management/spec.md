## Purpose

Lets a guest come back to a reservation they already hold — to read it or to
cancel it — proving who they are with the reference and the email address used
to make it, without an account.

## ADDED Requirements

### Requirement: A reservation is reached with its reference and email

The system SHALL return a reservation only when the request supplies both its
reference and the email address recorded on it, and SHALL answer a mismatched
pair the same way as an unknown reference, so that neither can be discovered by
probing.

#### Scenario: Correct reference and email

- **GIVEN** a reservation and the email address recorded on it
- **WHEN** the guest looks it up with both
- **THEN** the response has status 200 and carries the reference, room, arrival
  and departure dates, guest count, status and total payable at the property

#### Scenario: Reference with the wrong email

- **GIVEN** a valid reference and an email address that is not the one recorded
- **WHEN** the guest looks it up
- **THEN** the response has status 404 with a message that does not reveal
  whether the reference exists

#### Scenario: Unknown reference

- **GIVEN** a reference that matches no reservation
- **WHEN** the guest looks it up
- **THEN** the response has status 404 with the same message as for a mismatched
  email address

### Requirement: The manage page shows a reservation

The system SHALL offer a page where a guest enters a reference and an email
address, and on a successful lookup shows the reservation with its status and
the controls available for it.

#### Scenario: Successful lookup

- **GIVEN** a guest on the manage page with a valid reference and email address
- **WHEN** the lookup is submitted
- **THEN** the reservation page opens showing the room, dates, guest count,
  status, total payable at the property and a cancel control

#### Scenario: Failed lookup

- **GIVEN** a guest on the manage page with a reference and email that do not
  match a reservation
- **WHEN** the lookup is submitted
- **THEN** the page stays, shows that no reservation was found for those details,
  and keeps the entered reference

### Requirement: A guest can cancel a reservation in force

The system SHALL cancel a reservation on the guest's request when it is in force
and its arrival date has not passed, SHALL record the moment of cancellation,
and SHALL free the room's nights for other guests immediately.

#### Scenario: Cancellation succeeds

- **GIVEN** a reservation in force whose arrival date is in the future
- **WHEN** the guest cancels it with the correct reference and email address
- **THEN** the response has status 200, the reservation's status is cancelled,
  the cancellation moment is recorded, and the page shows the reservation as
  cancelled

#### Scenario: Nights are freed

- **GIVEN** a reservation that has just been cancelled
- **WHEN** availability is checked for the same room and the same nights
- **THEN** the room is reported available

#### Scenario: Cancelling twice

- **GIVEN** a reservation that is already cancelled
- **WHEN** the guest cancels it again
- **THEN** the response has status 200 and the reservation stays cancelled once,
  with its original cancellation moment unchanged

#### Scenario: Arrival date has passed

- **GIVEN** a reservation whose arrival date is in the past
- **WHEN** the guest tries to cancel it
- **THEN** the response has status 409, states that the stay can no longer be
  cancelled online, and gives the property's contact details
