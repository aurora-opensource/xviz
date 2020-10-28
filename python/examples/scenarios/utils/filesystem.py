import shutil
import yaml
from pathlib import Path


def get_collector_instances(output_file, extract_directory):
    output_file = Path(output_file)
    print("Using collector output file:", output_file)
    extract_directory = Path(extract_directory)
    print("Using extract directory:", extract_directory)
    if not output_file.is_file():
        print('collector output file does not exit')

    establish_fresh_directory(extract_directory)
    shutil.unpack_archive(str(output_file), str(extract_directory))

    return sorted(extract_directory.glob('*.txt'))


def establish_fresh_directory(path):
    if path.is_dir():
        clear_directory(path)
    else:
        path.mkdir(parents=True)


def clear_directory(path):
    for child in path.glob('*.txt'):
        child.unlink()


def load_config(configfile):
    with open(configfile, 'r') as f:
        return yaml.safe_load(f)
