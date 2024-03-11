To build the definitions you need to download `protoc` compiler with version greater than `v3.19`. Then execute
`protoc -I=<XVIZ_HOME> --python_out=<XVIZ_PY_HOME> <XVIZ_HOME>/xviz/v2/*.proto` to generated python bindings

The resulting files "import" statements include 'xviz.v2', which have to be changed to 'xviz_avs.v2' due to the
package name difference of the python package.
