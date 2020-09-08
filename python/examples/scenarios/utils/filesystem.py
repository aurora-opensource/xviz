

def establish_fresh_directory(path):
    if path.is_dir():
        clear_directory(path)
    else:
        path.mkdir(parents=True)


def clear_directory(path):
    for child in path.glob('*.txt'):
        child.unlink()
