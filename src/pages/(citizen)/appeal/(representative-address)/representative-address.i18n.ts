/**
 * Content for representative-address.
 *
 * WPAF1 question 2.3. Rule 21(5) requires any representative's address as well as the
 * appellant's, and once a representative is named this is where the papers go.
 */
export const en = {
  title: "What is the representative's address?",
  caption: "The appellant's representative",
  addressLabel: "What is the representative's address?",
  addressHint: "The tribunal will send papers about the appeal here.",
  addressLine1Label: "Address line 1",
  addressLine2Label: "Address line 2 (optional)",
  townOrCityLabel: "Town or city",
  countyLabel: "County (optional)",
  postcodeLabel: "Postcode",
  errors: {
    addressAddressLine1Required: "Enter the first line of the address",
    addressAddressLine1TooLong: "Address line 1 must be 100 characters or fewer",
    addressAddressLine2TooLong: "Address line 2 must be 100 characters or fewer",
    addressTownOrCityRequired: "Enter the town or city",
    addressTownOrCityTooLong: "Town or city must be 100 characters or fewer",
    addressCountyTooLong: "County must be 100 characters or fewer",
    addressPostcodeRequired: "Enter the postcode",
    addressPostcodeTooLong: "Postcode must be 10 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
