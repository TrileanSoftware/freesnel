/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { AsyncFnMock } from "@async-fn/jest";
import asyncFn from "@async-fn/jest";
import type { RenderResult } from "@testing-library/react";
import type { ApplicationBuilder } from "../../../../renderer/components/test-utils/get-application-builder";
import type { KubernetesCluster } from "../../../../common/catalog-entities";
import { getApplicationBuilder } from "../../../../renderer/components/test-utils/get-application-builder";
import { getExtensionFakeFor } from "../../../../renderer/components/test-utils/get-extension-fake";
import { getInjectable } from "@ogre-tools/injectable";
import { frontEndRouteInjectionToken } from "../../../../common/front-end-routing/front-end-route-injection-token";
import { computed } from "mobx";
import React from "react";
import { navigateToRouteInjectionToken } from "../../../../common/front-end-routing/navigate-to-route-injection-token";
import { routeSpecificComponentInjectionToken } from "../../../../renderer/routes/route-specific-component-injection-token";
import { KubeObject } from "../../../../common/k8s-api/kube-object";
import extensionShouldBeEnabledForClusterFrameInjectable from "../../../../renderer/extension-loader/extension-should-be-enabled-for-cluster-frame.injectable";
import apiManagerInjectable from "../../../../common/k8s-api/api-manager/manager.injectable";
import { KubeObjectDetails } from "../../../../renderer/components/kube-object-details";
import type { ApiManager } from "../../../../common/k8s-api/api-manager";

describe("disable kube object detail items when cluster is not relevant", () => {
  let builder: ApplicationBuilder;
  let rendered: RenderResult;
  let isEnabledForClusterMock: AsyncFnMock<
    (cluster: KubernetesCluster) => Promise<boolean>
  >;

  beforeEach(async () => {
    builder = getApplicationBuilder();

    builder.beforeApplicationStart(({ rendererDi }) => {
      rendererDi.override(
        apiManagerInjectable,
        () =>
          ({
            getStore: () => ({
              getByPath: () =>
                getKubeObjectStub("some-kind", "some-api-version"),
            }),
          } as unknown as ApiManager),
      );
    });

    const rendererDi = builder.dis.rendererDi;

    rendererDi.unoverride(extensionShouldBeEnabledForClusterFrameInjectable);

    rendererDi.register(testRouteInjectable, testRouteComponentInjectable);

    builder.setEnvironmentToClusterFrame();

    const getExtensionFake = getExtensionFakeFor(builder);

    isEnabledForClusterMock = asyncFn();

    const testExtension = getExtensionFake({
      id: "test-extension-id",
      name: "test-extension",

      rendererOptions: {
        isEnabledForCluster: isEnabledForClusterMock,

        kubeObjectDetailItems: [
          {
            kind: "some-kind",
            apiVersions: ["some-api-version"],
            components: {
              Details: () => (
                <div data-testid="some-kube-object-detail-item">
                  Some detail
                </div>
              ),
            },
          },
        ],
      },
    });

    rendered = await builder.render();

    const navigateToRoute = rendererDi.inject(navigateToRouteInjectionToken);
    const testRoute = rendererDi.inject(testRouteInjectable);

    navigateToRoute(testRoute);

    builder.extensions.enable(testExtension);
  });

  describe("given not yet known if extension should be enabled for the cluster", () => {
    it("renders", () => {
      expect(rendered.baseElement).toMatchSnapshot();
    });

    it("does not show the kube object detail item", () => {
      const actual = rendered.queryByTestId("some-kube-object-detail-item");

      expect(actual).not.toBeInTheDocument();
    });
  });

  describe("given extension shouldn't be enabled for the cluster", () => {
    beforeEach(async () => {
      await isEnabledForClusterMock.resolve(false);
    });

    it("renders", () => {
      expect(rendered.baseElement).toMatchSnapshot();
    });

    it("does not show the kube object detail item", () => {
      const actual = rendered.queryByTestId("some-kube-object-detail-item");

      expect(actual).not.toBeInTheDocument();
    });
  });

  describe("given extension should be enabled for the cluster", () => {
    beforeEach(async () => {
      await isEnabledForClusterMock.resolve(true);
    });

    it("renders", () => {
      expect(rendered.baseElement).toMatchSnapshot();
    });

    it("shows the kube object detail item", () => {
      const actual = rendered.getByTestId("some-kube-object-detail-item");

      expect(actual).toBeInTheDocument();
    });
  });
});

const testRouteInjectable = getInjectable({
  id: "test-route",

  instantiate: () => ({
    path: "/test-route",
    clusterFrame: true,
    isEnabled: computed(() => true),
  }),

  injectionToken: frontEndRouteInjectionToken,
});

const testRouteComponentInjectable = getInjectable({
  id: "test-route-component",

  instantiate: (di) => ({
    route: di.inject(testRouteInjectable),

    Component: () => <KubeObjectDetails />,
  }),

  injectionToken: routeSpecificComponentInjectionToken,
});

const getKubeObjectStub = (kind: string, apiVersion: string) =>
  KubeObject.create({
    apiVersion,
    kind,
    metadata: {
      uid: "some-uid",
      name: "some-name",
      resourceVersion: "some-resource-version",
      namespace: "some-namespace",
      selfLink: "",
    },
  });
