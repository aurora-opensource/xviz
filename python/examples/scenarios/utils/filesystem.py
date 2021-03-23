import shutil
import yaml
from pathlib import Path
import os

FILE_PATH = Path(__file__).parent.absolute()

def load_global_config(machine_type):
    new_path = os.path.join(FILE_PATH, '../../../../Global-Configs/')

    print("LOOKING FOR GC IN:", new_path)
    for subdir, dirnames, files in os.walk(new_path):
        for file in files:
            filepath = subdir + os.sep + file
            filename = os.path.splitext(file)[0]
            if (filename.upper() == machine_type.upper()) and (
                    filepath.endswith('.yaml') or filepath.endswith('.yml')):
                print('found global config file for ', machine_type)
                return load_config(filepath)

    # if here, something bad happened
    return {}

def get_collector_instances(output_file, extract_directory):
    output_file = Path(output_file)
    print("Using collector output file:", output_file)
    extract_directory = Path(extract_directory)
    print("Using extract directory:", extract_directory)
    if not output_file.is_file():
        print('collector output file does not exit')

    establish_fresh_directory(extract_directory)
    shutil.unpack_archive(str(output_file), str(extract_directory))

    # sort by the last componenent of the file names
    return sorted(extract_directory.glob('*.txt'),
                  key=lambda x: int(x.stem.split('-')[-1]))


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
