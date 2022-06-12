#!/bin/bash

podman run --rm -ti \
    --userns keep-id \
    --name lens_ui \
    -v $(pwd)/:/app \
    -w /app \
    docker.io/node:16 \
    make Appimage

