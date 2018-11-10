# UI Primitives

These are XVIZ primitives that are designed to be used in 2D UI, like the XVIZ declarative UI
framework.

## TreeTable Type

The TreeTable primitive represents data in a way similar to that of a file system explorer window.
The data is hierarchical with common fields at each node and some fields being empty depending on
where the node sits in the tree. Each node is typically rendered as one row in TreeTable with higher
level nodes being collapsible.

| Name      | Type                     | Description                                                                                           |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `columns` | `list<treetable_column>` | Data specifying the columns of the table portion of a TreeTable.                                      |
| `nodes`   | `list<treetable_node>`   | Data specifying the contents of the nodes which can be thought of as the data of the rows in a table. |

### TreeTable Columns

TreeTable columns correspond to the fields available at each node in the TreeTable. Additionally,
they contain information on the type of data represented in the column and the units of the data
represented.

| Name           | Type               | Description                                                            |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| `display_text` | `string`           | The actual text to display in the header of the TreeTable              |
| `type`         | `type_id`          | One of the acceptable types for XVIZ variables                         |
| `unit`         | `optional<string>` | The unit for the data in this column like "meters" or "m/s" or "miles" |

### TreeTable Nodes (Rows)

TreeTable nodes act like nodes in a tree or rows in a table. Note that columns are not guaranteed to
have a value at every node. An example of this would be how many file browsers don’t list a size for
folders.

| Name            | Type                          | Description                                                                       |
| --------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| `id`            | `treetable_node_id`           | The ID of this node within the TreeTable                                          |
| `parent`        | `optional<treetable_node_id>` | The ID of the parent, essentially a pointer to parent, not present in root nodes. |
| `column_values` | `list<string>`                | A list of the column values with index corresponding to column.                   |

## Example

Here is an example tree table with two columns "Age" and "Name".

```javascript
{
  "columns": [
    {
      "display_text": "Age",
      "type": "integer",
      "unit": "Years"
    },
    {
      "display_text": "Name",
      "type": "string"
    }
  ],
  "nodes": [
    {
      "id": 0
    },
    {
      "id": 1,
      "parent": 0,
      "column_values": ["10", "Jim"]
    },
    {
      "id": 2,
      "parent": 0,
      "column_values": ["22", "Bob"]
    }
  ]
}
```
