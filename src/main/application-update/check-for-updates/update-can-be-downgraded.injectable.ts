/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";

const updateCanBeDowngradedInjectable = getInjectable({
  id: "update-can-be-downgraded",

  instantiate: (di) => {
    return computed(() => true);
  },
});

export default updateCanBeDowngradedInjectable;
