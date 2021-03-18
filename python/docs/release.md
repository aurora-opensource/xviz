# build
python setup.py sdist bdist_wheel

# install from local tgz
pip install dist/xviz_avs-X.X.X.tar.gz

# test.pypi.org upload
twine upload --repository-url https://test.pypi.org/legacy/ dist/*

# pypi.org upload
twine upload dist/*
