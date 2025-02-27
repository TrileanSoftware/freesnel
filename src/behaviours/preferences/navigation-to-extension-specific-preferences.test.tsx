/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { RenderResult } from "@testing-library/react";
import type { ApplicationBuilder } from "../../renderer/components/test-utils/get-application-builder";
import { getApplicationBuilder } from "../../renderer/components/test-utils/get-application-builder";
import React from "react";
import "@testing-library/jest-dom/extend-expect";
import type { FakeExtensionData, TestExtension } from "../../renderer/components/test-utils/get-renderer-extension-fake";
import { getRendererExtensionFakeFor } from "../../renderer/components/test-utils/get-renderer-extension-fake";
import type { DiContainer } from "@ogre-tools/injectable";
import { getDiForUnitTesting } from "../../renderer/getDiForUnitTesting";
import extensionPreferencesRouteInjectable from "../../common/front-end-routing/routes/preferences/extension/extension-preferences-route.injectable";


describe("preferences - navigation to extension specific preferences", () => {
  let applicationBuilder: ApplicationBuilder;

  beforeEach(() => {
    applicationBuilder = getApplicationBuilder();
  });

  describe("given in preferences, when rendered", () => {
    let rendered: RenderResult;

    beforeEach(async () => {
      applicationBuilder.beforeRender(() => {
        applicationBuilder.preferences.navigate();
      });

      rendered = await applicationBuilder.render();
    });

    it("renders", () => {
      expect(rendered.container).toMatchSnapshot();
    });

    it("does not show extension preferences yet", () => {
      const page = rendered.queryByTestId("extension-preferences-page");

      expect(page).toBeNull();
    });

    it("does not show link for extension preferences", () => {
      const actual = rendered.queryByTestId("tab-link-for-extensions");

      expect(actual).toBeNull();
    });

    describe("given multiple extensions with specific preferences, when navigating to extension specific preferences page", () => {
      beforeEach(async () => {
        const getRendererExtensionFake = getRendererExtensionFakeFor(applicationBuilder);
        const someTestExtension = getRendererExtensionFake(extensionStubWithExtensionSpecificPreferenceItems);
        const someOtherTestExtension = getRendererExtensionFake(someOtherExtensionStubWithExtensionSpecificPreferenceItems);

        await applicationBuilder.extensions.renderer.enable(someTestExtension, someOtherTestExtension);
        applicationBuilder.preferences.navigation.click("extension-some-test-extension-id");
      });

      it("renders", () => {
        expect(rendered.container).toMatchSnapshot();
      });

      it("doesn't show preferences from unrelated extension", () => {
        const actual = rendered.queryByTestId("extension-preference-item-for-some-other-preference-item-id");

        expect(actual).toBeNull();
      });

      it("shows preferences from related extension", () => {
        const actual = rendered.getByTestId("extension-preference-item-for-some-preference-item-id");

        expect(actual).not.toBeNull();
      });
    });

    describe("given multiple extensions with and without specific preferences", () => {
      beforeEach(async () => {
        const getRendererExtensionFake = getRendererExtensionFakeFor(applicationBuilder);
        const someTestExtension = getRendererExtensionFake(extensionStubWithExtensionSpecificPreferenceItems);
        const extensionWithoutPreferences = getRendererExtensionFake(extensionStubWithoutPreferences);
        const extensionWithSpecificTab = getRendererExtensionFake(extensionStubWithShowInPreferencesTab);

        await applicationBuilder.extensions.renderer.enable(someTestExtension, extensionWithoutPreferences, extensionWithSpecificTab);
      });

      it("doesn't show link for extension without preferences", () => {
        const actual = rendered.queryByTestId("tab-link-for-extension-without-preferences-id");

        expect(actual).toBeNull();
      });

      it("doesn't show link for preferences intended for a specific tab", () => {
        const actual = rendered.queryByTestId("tab-link-for-extension-specified-preferences-page-id");

        expect(actual).toBeNull();
      });
    });

    describe("when extension with specific preferences is enabled", () => {
      let testExtension: TestExtension;

      beforeEach(() => {
        const getRendererExtensionFake = getRendererExtensionFakeFor(applicationBuilder);

        testExtension = getRendererExtensionFake(
          extensionStubWithExtensionSpecificPreferenceItems,
        );

        applicationBuilder.extensions.renderer.enable(testExtension);
      });

      it("renders", () => {
        expect(rendered.container).toMatchSnapshot();
      });

      it("shows link for extension preferences", () => {
        const actual = rendered.getByTestId("tab-link-for-extension-some-test-extension-id");

        expect(actual).not.toBeNull();
      });

      it("link should not be active", () => {
        const actual = rendered.getByTestId("tab-link-for-extension-some-test-extension-id");

        expect(actual).not.toHaveClass("active");
      });

      describe("when navigating to extension preferences using navigation", () => {
        beforeEach(() => {
          applicationBuilder.preferences.navigation.click("extension-some-test-extension-id");
        });

        it("renders", () => {
          expect(rendered.container).toMatchSnapshot();
        });

        it("shows proper page title", () => {
          const title = rendered.getByText("some-test-extension-id preferences");

          expect(title).toBeInTheDocument();
        });

        it("shows extension specific preferences", () => {
          const page = rendered.getByTestId("extension-preferences-page");

          expect(page).not.toBeNull();
        });

        it("shows extension specific preference item", () => {
          const actual = rendered.getByTestId("extension-preference-item-for-some-preference-item-id");

          expect(actual).not.toBeNull();
        });

        it("does not show unrelated preference tab items", () => {
          const actual = rendered.queryByTestId("extension-preference-item-for-some-unrelated-preference-item-id");

          expect(actual).toBeNull();
        });

        it("link is active", () => {
          const actual = rendered.getByTestId("tab-link-for-extension-some-test-extension-id");

          expect(actual).toHaveClass("active");
        });

        describe("when extension is disabled", () => {
          beforeEach(() => {
            applicationBuilder.extensions.renderer.disable(testExtension);
          });

          it("renders", () => {
            expect(rendered.baseElement).toMatchSnapshot();
          });

          it("shows the error message about extension not being present", () => {
            expect(rendered.getByTestId("error-for-extension-not-being-present")).toBeInTheDocument();
          });

          it("when extension is enabled again, does not show the error message anymore", () => {
            applicationBuilder.extensions.renderer.enable(testExtension);

            expect(rendered.queryByTestId("error-for-extension-not-being-present")).not.toBeInTheDocument();
          });
        });
      });
    });

    describe("given extension with registered tab", () => {
      beforeEach(async () => {
        const getRendererExtensionFake = getRendererExtensionFakeFor(applicationBuilder);
        const extension = getRendererExtensionFake(extensionStubWithWithRegisteredTab);

        await applicationBuilder.extensions.renderer.enable(extension);
      });

      it("shows extension tab in general area", () => {
        const actual = rendered.getByTestId("tab-link-for-extension-registered-tab-page-id-nav-item-metrics-extension-tab");

        expect(actual).toMatchSnapshot();
      });

      it("does not show custom settings block", () => {
        const actual = rendered.queryByTestId("extension-settings");

        expect(actual).not.toBeInTheDocument();
      });

      describe("when navigating to specific extension tab", () => {
        beforeEach(() => {
          applicationBuilder.preferences.navigation.click("extension-registered-tab-page-id-nav-item-metrics-extension-tab");
        });
        it("renders", () => {
          expect(rendered.container).toMatchSnapshot();
        });
        it("shows related preferences for this tab", () => {
          const actual = rendered.getByTestId("metrics-preference-item-hint");

          expect(actual).toBeInTheDocument();
        });
        it("does not show unrelated preferences for this tab", () => {
          const actual = rendered.queryByTestId("survey-preference-item-hint");

          expect(actual).not.toBeInTheDocument();
        });
      });
    });

    describe("given extension with few registered tabs", () => {
      const tabs = [
        "tab-link-for-extension-hello-world-tab-page-id-nav-item-hello-extension-tab",
        "tab-link-for-extension-hello-world-tab-page-id-nav-item-logs-extension-tab",
      ];

      beforeEach(async () => {
        const getRendererExtensionFake = getRendererExtensionFakeFor(applicationBuilder);
        const extension = getRendererExtensionFake(extensionStubWithWithRegisteredTabs);

        await applicationBuilder.extensions.renderer.enable(extension);
      });

      it.each(tabs)("shows '%s' tab in general area", (tab) => {
        const tabElement = rendered.getByTestId(tab);

        expect(tabElement).toBeInTheDocument();
      });
    });

    describe("given extensions with tabs having same id", () => {
      beforeEach(async () => {
        const getRendererExtensionFake = getRendererExtensionFakeFor(applicationBuilder);
        const extension = getRendererExtensionFake(extensionStubWithWithRegisteredTab);
        const otherExtension = getRendererExtensionFake(extensionStubWithWithSameRegisteredTab);

        await applicationBuilder.extensions.renderer.enable(extension, otherExtension);
      });

      it("shows tab from the first extension", () => {
        const actual = rendered.getByTestId("tab-link-for-extension-registered-tab-page-id-nav-item-metrics-extension-tab");

        expect(actual).toBeInTheDocument();
      });

      it("shows tab from the second extension", () => {
        const actual = rendered.getByTestId("tab-link-for-extension-duplicated-tab-page-id-nav-item-metrics-extension-tab");

        expect(actual).toBeInTheDocument();
      });

      describe("when navigating to first extension tab", () => {
        beforeEach(() => {
          applicationBuilder.preferences.navigation.click("extension-registered-tab-page-id-nav-item-metrics-extension-tab");
        });

        it("renders", () => {
          expect(rendered.container).toMatchSnapshot();
        });

        it("shows related preferences for this tab", () => {
          const actual = rendered.getByTestId("metrics-preference-item-hint");

          expect(actual).toBeInTheDocument();
        });

        it("does not show unrelated preferences for this tab", () => {
          const actual = rendered.queryByTestId("another-metrics-preference-item-hint");

          expect(actual).not.toBeInTheDocument();
        });
      });

      describe("when navigating to second extension tab", () => {
        beforeEach(() => {
          applicationBuilder.preferences.navigation.click("extension-duplicated-tab-page-id-nav-item-metrics-extension-tab");
        });

        it("renders", () => {
          expect(rendered.container).toMatchSnapshot();
        });

        it("shows related preferences for this tab", () => {
          const actual = rendered.getByTestId("another-metrics-preference-item-hint");

          expect(actual).toBeInTheDocument();
        });

        it("does not show unrelated preferences for this tab", () => {
          const actual = rendered.queryByTestId("metrics-preference-item-hint");

          expect(actual).not.toBeInTheDocument();
        });
      });
    });
  });

  describe("when navigating to extension specific tab", () => {
    let rendered: RenderResult;
    let di: DiContainer;

    beforeEach(async () => {
      di = getDiForUnitTesting({ doGeneralOverrides: true });

      const getRendererExtensionFake = getRendererExtensionFakeFor(applicationBuilder);
      const extension = getRendererExtensionFake(extensionStubWithWithSameRegisteredTab);
      const otherExtension = getRendererExtensionFake(extensionUsingSomeoneElseTab);

      applicationBuilder.beforeRender(() => {
        const extensionRoute = di.inject(extensionPreferencesRouteInjectable);
        const params = { parameters: {
          extensionId: "duplicated-tab-page-id",
          tabId: "metrics-extension-tab",
        }};

        applicationBuilder.preferences.navigateTo(extensionRoute, params);
      });

      await applicationBuilder.extensions.renderer.enable(extension, otherExtension);
      rendered = await applicationBuilder.render();
    });

    it("renders", () => {
      expect(rendered.container).toMatchSnapshot();
    });

    it("does render related preferences for specific tab", () => {
      expect(rendered.getByTestId("another-metrics-preference-item-hint")).toBeInTheDocument();
    });

    it("does not render related preferences for specific tab", () => {
      expect(rendered.queryByTestId("my-preferences-item-hint")).not.toBeInTheDocument();
    });
  });

  describe("when navigating to someone else extension specific tab", () => {
    let rendered: RenderResult;
    let di: DiContainer;

    beforeEach(async () => {
      di = getDiForUnitTesting({ doGeneralOverrides: true });

      const getRendererExtensionFake = getRendererExtensionFakeFor(applicationBuilder);
      const extension = getRendererExtensionFake(extensionStubWithWithSameRegisteredTab);
      const extensionUsingOtherTab = getRendererExtensionFake(extensionUsingSomeoneElseTab);

      applicationBuilder.beforeRender(() => {
        const extensionRoute = di.inject(extensionPreferencesRouteInjectable);
        const params = { parameters: {
          extensionId: "extension-using-someone-else-tab-id",
          tabId: "metrics-extension-tab",
        }};

        applicationBuilder.preferences.navigateTo(extensionRoute, params);
      });

      await applicationBuilder.extensions.renderer.enable(extension, extensionUsingOtherTab);
      rendered = await applicationBuilder.render();
    });

    it("renders", () => {
      expect(rendered.container).toMatchSnapshot();
    });
  });
});

const extensionStubWithExtensionSpecificPreferenceItems: FakeExtensionData = {
  id: "some-test-extension-id",
  name: "some-test-extension-id",
  appPreferences: [
    {
      title: "Some preference item",
      id: "some-preference-item-id",

      components: {
        Hint: () => <div data-testid="some-preference-item-hint" />,
        Input: () => <div data-testid="some-preference-item-input" />,
      },
    },

    {
      title: "irrelevant",
      id: "some-unrelated-preference-item-id",
      showInPreferencesTab: "some-tab",

      components: {
        Hint: () => <div />,
        Input: () => <div />,
      },
    },
  ],
};

const someOtherExtensionStubWithExtensionSpecificPreferenceItems: FakeExtensionData = {
  id: "some-other-test-extension-id",
  name: "some-other-test-extension-id",

  appPreferences: [
    {
      title: "Test preference item",
      id: "some-other-preference-item-id",

      components: {
        Hint: () => <div data-testid="some-other-preference-item-hint" />,
        Input: () => <div data-testid="some-other-preference-item-input" />,
      },
    },
  ],
};

const extensionStubWithoutPreferences: FakeExtensionData = {
  id: "without-preferences-id",
  name: "without-preferences-id",
};

const extensionStubWithShowInPreferencesTab: FakeExtensionData = {
  id: "specified-preferences-page-id",
  name: "specified-preferences-page-name",

  appPreferences: [
    {
      title: "Test preference item",
      id: "very-other-preference-item-id",
      showInPreferencesTab: "some-tab",

      components: {
        Hint: () => <div data-testid="very-other-preference-item-hint" />,
        Input: () => <div data-testid="very-other-preference-item-input" />,
      },
    },
  ],
};

const extensionStubWithWithRegisteredTab: FakeExtensionData = {
  id: "registered-tab-page-id",
  name: "registered-tab-page-id",

  appPreferences: [
    {
      title: "License item",
      id: "metrics-preference-item-id",
      showInPreferencesTab: "metrics-extension-tab",

      components: {
        Hint: () => <div data-testid="metrics-preference-item-hint" />,
        Input: () => <div data-testid="metrics-preference-item-input" />,
      },
    },
    {
      title: "Menu item",
      id: "menu-preference-item-id",
      showInPreferencesTab: "menu-extension-tab",

      components: {
        Hint: () => <div data-testid="menu-preference-item-hint" />,
        Input: () => <div data-testid="menu-preference-item-input" />,
      },
    },
    {
      title: "Survey item",
      id: "survey-preference-item-id",
      showInPreferencesTab: "survey-extension-tab",

      components: {
        Hint: () => <div data-testid="survey-preference-item-hint" />,
        Input: () => <div data-testid="survey-preference-item-input" />,
      },
    },
  ],

  appPreferenceTabs: [{
    title: "Metrics tab",
    id: "metrics-extension-tab",
    orderNumber: 100,
  }],
};

const extensionStubWithWithRegisteredTabs: FakeExtensionData = {
  id: "hello-world-tab-page-id",
  name: "hello-world-tab-page-id",

  appPreferences: [
    {
      title: "Hello world",
      id: "hello-preference-item-id",
      showInPreferencesTab: "hello-extension-tab",

      components: {
        Hint: () => <div data-testid="hello-preference-item-hint" />,
        Input: () => <div data-testid="hello-preference-item-input" />,
      },
    },
    {
      title: "Logs",
      id: "logs-preference-item-id",
      showInPreferencesTab: "logs-extension-tab",

      components: {
        Hint: () => <div data-testid="logs-preference-item-hint" />,
        Input: () => <div data-testid="logs-preference-item-input" />,
      },
    },
  ],

  appPreferenceTabs: [{
    title: "Metrics tab",
    id: "hello-extension-tab",
    orderNumber: 100,
  }, {
    title: "Logs tab",
    id: "logs-extension-tab",
    orderNumber: 200,
  }],
};

const extensionStubWithWithSameRegisteredTab: FakeExtensionData = {
  id: "duplicated-tab-page-id",
  name: "duplicated-tab-page-id",

  appPreferences: [
    {
      title: "Another metrics",
      id: "another-metrics-preference-item-id",
      showInPreferencesTab: "metrics-extension-tab",

      components: {
        Hint: () => <div data-testid="another-metrics-preference-item-hint" />,
        Input: () => <div data-testid="another-metrics-preference-item-input" />,
      },
    },
  ],

  appPreferenceTabs: [{
    title: "Metrics tab",
    id: "metrics-extension-tab",
    orderNumber: 100,
  }],
};

const extensionUsingSomeoneElseTab: FakeExtensionData = {
  id: "extension-using-someone-else-tab-id",
  name: "extension-using-someone-else-tab-id",

  appPreferences: [
    {
      title: "My preferences",
      id: "my-preferences-item-id",
      showInPreferencesTab: "metrics-extension-tab",

      components: {
        Hint: () => <div data-testid="my-preferences-item-hint" />,
        Input: () => <div data-testid="my-preferences-item-input" />,
      },
    },
  ],
};
