import React from "react";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithProviders } from "__support__/ui";
import { mockSettings } from "__support__/settings";

import ProfileLink from "metabase/nav/components/ProfileLink";

const REGULAR_ITEMS = [
  "Account settings",
  "Activity",
  "Help",
  "About Metabase",
  "Sign out",
];
const ADMIN_ITEMS = [...REGULAR_ITEMS, "Admin settings"];
const HOSTED_ITEMS = [...ADMIN_ITEMS];

const adminNavItem = {
  name: `People`,
  path: "/admin/people",
  key: "people",
};

const setupState = hasAdminNavItems => {
  const admin = {
    app: {
      paths: hasAdminNavItems ? [adminNavItem] : [],
    },
  };

  return {
    storeInitialState: {
      admin,
    },
  };
};

describe("ProfileLink", () => {
  describe("options", () => {
    ["regular", "hosted"].forEach(testCase => {
      describe(`${testCase} instance`, () => {
        beforeEach(() => {
          mockSettings({ "is-hosted?": false });
        });

        if (testCase === "hosted") {
          beforeEach(() => {
            mockSettings({ "is-hosted?": true });
          });
        }

        describe("normal user", () => {
          it("should show the proper set of items", () => {
            const normalUser = { is_superuser: false };
            renderWithProviders(
              <ProfileLink user={normalUser} context={""} />,
              setupState(),
            );

            assertOn(REGULAR_ITEMS);
          });
        });

        describe("admin", () => {
          it("should show the proper set of items", () => {
            const admin = { is_superuser: true };
            renderWithProviders(
              <ProfileLink user={admin} context={""} />,
              setupState(true),
            );

            testCase === "hosted"
              ? assertOn(HOSTED_ITEMS)
              : assertOn(ADMIN_ITEMS);
          });
        });
      });
    });
  });
});

function assertOn(items) {
  const SETTINGS = screen.getByRole("img", { name: /gear/i });
  fireEvent.click(SETTINGS);

  items.forEach(title => {
    screen.getByText(title);
  });

  expect(screen.getAllByRole("listitem").length).toEqual(items.length);
}
