/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import styles from "./entity-settings.module.scss";

import React from "react";
import { observable, makeObservable, IComputedValue, computed } from "mobx";
import type { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { navigation } from "../../navigation";
import { Tabs, Tab } from "../tabs";
import type { CatalogEntity } from "../../api/catalog-entity";
import type { EntitySettingRegistration } from "../../../extensions/registries";
import type { EntitySettingsRouteParams } from "../../../common/routes";
import { groupBy } from "lodash";
import { SettingLayout } from "../layout/setting-layout";
import { Avatar } from "../avatar";
import { withInjectables } from "@ogre-tools/injectable-react";
import entitySettingItemsInjectable from "./entity-setting-items.injectable";
import routeCatalogEntityInjectable from "./route-catalog-entity.injectable";

interface Props extends RouteComponentProps<EntitySettingsRouteParams> {
}

interface Dependencies {
  registrations: IComputedValue<EntitySettingRegistration[]>
  entity: IComputedValue<CatalogEntity>
}

@observer
class NonInjectedEntitySettings extends React.Component<Props & Dependencies> {
  @observable activeTab: string;

  constructor(props: Props & Dependencies) {
    super(props);
    makeObservable(this);

    const { hash } = navigation.location;

    if (hash) {
      const menuId = hash.slice(1);
      const item = this.menuItems.find((item) => item.id === menuId);

      if (item) {
        this.activeTab = item.id;
      }
    }
  }

  @computed get entity() {
    return this.props.entity.get();
  }

  @computed get menuItems() {
    return this.props.registrations.get();
  }

  get activeSetting() {
    this.activeTab ||= this.menuItems[0]?.id;

    return this.menuItems.find((setting) => setting.id === this.activeTab);
  }

  onTabChange = (tabId: string) => {
    this.activeTab = tabId;
  };

  renderNavigation() {
    const groups = Object.entries(groupBy(this.menuItems, (item) => item.group || "Extensions"));

    groups.sort((a, b) => {
      if (a[0] === "Settings") return -1;
      if (a[0] === "Extensions") return 1;

      return a[0] <= b[0] ? -1 : 1;
    });

    return (
      <>
        <div className="flex items-center pb-8">
          <Avatar
            title={this.entity.getName()}
            colorHash={`${this.entity.getName()}-${this.entity.metadata.source}`}
            src={this.entity.spec.icon?.src}
            className={styles.settingsAvatar}
            size={40}
          />
          <div className={styles.entityName}>
            {this.entity.getName()}
          </div>
        </div>
        <Tabs className="flex column" scrollable={false} onChange={this.onTabChange} value={this.activeTab}>
          { groups.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              <hr/>
              <div className="header">{group[0]}</div>
              { group[1].map((setting, index) => (
                <Tab
                  key={index}
                  value={setting.id}
                  label={setting.title}
                  data-testid={`${setting.id}-tab`}
                />
              ))}
            </React.Fragment>
          ))}
        </Tabs>
      </>
    );
  }

  render() {
    const { activeSetting } = this;

    if (!this.entity) {
      return null;
    }

    return (
      <SettingLayout
        navigation={this.renderNavigation()}
        contentGaps={false}
      >
        {
          activeSetting && (
            <section>
              <h2 data-testid={`${activeSetting.id}-header`}>{activeSetting.title}</h2>
              <section>
                <activeSetting.components.View entity={this.entity} key={activeSetting.title} />
              </section>
            </section>
          )
        }
      </SettingLayout>
    );
  }
}

export const EntitySettings = withInjectables<Dependencies, Props>(
  NonInjectedEntitySettings,

  {
    getProps: (di, props) => ({
      registrations: di.inject(entitySettingItemsInjectable),
      entity: di.inject(routeCatalogEntityInjectable),
      ...props,
    }),
  },
);
