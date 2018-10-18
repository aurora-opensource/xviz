# Panel Primitives

## TreeTable Primitive

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

| Name            | Type                            | Description                                                     |
| --------------- | ------------------------------- | --------------------------------------------------------------- |
| `id`            | `treetable_node_id`             | The ID of this node within the TreeTable                        |
| `parent`        | `treetable_node_id`             | The ID of the parent, essentially a pointer to parent           |
| `column_values` | `list<optional<value_variant>>` | A list of the column values with index corresponding to column. |

### Error Handling in TreeTables

When parsing TreeTable values into JSON representations there is a possibility that an unparsable
value or a value with an incorrect data type is present. To prevent a single bad value from crashing
the entire TreeTable conversion, these values will be represented as null and an error message will
be included in a special errors field in the TreeTable’s JSON representation.

#### The Errors Field

The errors field is used to send additional information about any errors that came up while
converting the TreeTable from its server side representation into JSON.

| Name     | Type                    | Description                                                         |
| -------- | ----------------------- | ------------------------------------------------------------------- |
| `errors` | `list<treetable_error>` | A list of errors with more detailed information about what happened |

#### The TreeTable Error Type

The TreeTable error type includes information about the location within the treetable where the
error occurred along with a description of what error has occurred.

| Name      | Type                  | Description                                |
| --------- | --------------------- | ------------------------------------------ |
| `message` | `string`              | Details of what error has occurred and why |
| `column`  | `treetable_column_id` | The column with the error value            |
| `node`    | `treetable_node_id`   | The node/row with the error value          |
