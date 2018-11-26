# Layout Elements

Layout elements are different from components in that they do not directly consume XVIZ stream data.
Layout elements provide information about how to arrange components as well as additional
information about their contents.

## Panels

Panels are typically grouped together in tabs along the edge of an application. Panels group
together related pieces of data at a high level. Panels provide a convenient way for a team to group
all of their data together.

_TODO: screentshot: panel from streetscape.gl demo app_

| **Name**       | **Type**                       | **Description**                                                                                          |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `name`         | `string`                       | The name of this panel, will be displayed at the top of the panel                                        |
| `layout`       | `layout_type`                  | One of the supported layout types; defines how the elements inside of the panel should be arranged.      |
| `interactions` | `list<interaction_type>`       | A list of all of the interactions supported by this panel.                                               |
| `children`     | `list<component OR container>` | All of the components and containers inside of this panel and the order in which they should be rendered |

## Containers

Containers are used to group components together into logical groupings of information that should
be displayed together. To some extent, they can be thought of as HTML `<div>`s. Components within
the container will be rendered above any other containers that are nested inside of the container.

_TODO: screentshot: panel with containers from streetscape.gl demo app_

| **Name**       | **Type**                       | **Description**                                                                                          |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `name`         | `string`                       | The name of this container, will be displayed at the top of the container                                |
| `layout`       | `layout_type`                  | One of the supported layout types; defines how the elements inside of the panel should be arranged.      |
| `interactions` | `list<interaction_type>`       | A list of all of the interactions supported by this panel.                                               |
| `children`     | `list<component OR container>` | All of the components and containers inside of this panel and the order in which they should be rendered |
