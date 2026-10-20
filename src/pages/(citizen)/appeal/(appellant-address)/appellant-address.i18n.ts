/**
 * Content for appellant-address.
 *
 * WPAF1 question 1.2. Typed in rather than looked up: a postcode lookup needs a licensed
 * address service, which a prototype does not have. Rule 21(5) requires the appellant's
 * address and an address for documents, so this is one of the few things an appeal cannot
 * be registered without.
 */
export const en = {
  title: "What is the appellant's address?",
  caption: "About the appellant",
  addressLabel: "What is the appellant's address?",
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
