/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { updateChannels } from "../update-channels";

const defaultUpdateChannelInjectable = getInjectable({
  id: "default-update-channel",

  instantiate: (di) => {
    return updateChannels.none;
  },
});

export default defaultUpdateChannelInjectable;
