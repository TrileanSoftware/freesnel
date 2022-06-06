/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { IAsyncComputed } from "@ogre-tools/injectable-react";
import { withInjectables } from "@ogre-tools/injectable-react";
import React from "react";
import publicHelmRepositoriesInjectable from "./public-helm-repositories/public-helm-repositories.injectable";
import type { HelmRepo } from "../../../../../../common/helm-repo";
import type { SelectOption } from "../../../../select";
import { Select } from "../../../../select";
import { Icon } from "../../../../icon";
import { observer } from "mobx-react";
import type { SingleValue } from "react-select";
import selectHelmRepositoryInjectable from "./select-helm-repository/select-helm-repository.injectable";
import { matches } from "lodash/fp";
import activeHelmRepositoriesInjectable from "../active-helm-repositories.injectable";

interface Dependencies {
  publicRepositories: IAsyncComputed<HelmRepo[]>;
  activeRepositories: IAsyncComputed<HelmRepo[]>;
  selectRepository: (value: SingleValue<SelectOption<HelmRepo>>) => void;
}

const NonInjectedActivationOfPublicHelmRepository = observer(({
  publicRepositories,
  activeRepositories,
  selectRepository,
}: Dependencies) => {
  const dereferencesPublicRepositories = publicRepositories.value.get();
  const dereferencesActiveRepositories = activeRepositories.value.get();

  const valuesAreLoading = publicRepositories.pending.get() || activeRepositories.pending.get();

  const repositoryOptions = dereferencesPublicRepositories.map(repository => ({
    value: repository,
    label: repository.name,
    isSelected: !!dereferencesActiveRepositories.find(matches({ name: repository.name })),
  }));

  return (
    <div>
      <Select
        id="selection-of-active-public-helm-repository"
        placeholder="Repositories"
        isLoading={valuesAreLoading}
        isDisabled={valuesAreLoading}
        options={repositoryOptions}
        onChange={selectRepository}
        value={dereferencesPublicRepositories}
        formatOptionLabel={formatOptionLabel}
        controlShouldRenderValue={false}
        className="box grow"
        themeName="lens"
      />
    </div>
  );
});

export const ActivationOfPublicHelmRepository = withInjectables<Dependencies>(
  NonInjectedActivationOfPublicHelmRepository,

  {
    getProps: (di) => ({
      publicRepositories: di.inject(publicHelmRepositoriesInjectable),
      activeRepositories: di.inject(activeHelmRepositoriesInjectable),
      selectRepository: di.inject(selectHelmRepositoryInjectable),
    }),
  },
);

const formatOptionLabel = ({ value, isSelected }: SelectOption<HelmRepo>) => (
  <div className="flex gaps">
    <span>{value.name}</span>
    {isSelected && (
      <Icon
        small
        material="check"
        className="box right" />
    )}
  </div>
);
