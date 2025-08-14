import os
import logging
from logging.handlers import RotatingFileHandler
from colorama import Fore, Style, init

# Khởi tạo colorama cho Windows
init(autoreset=True)

class MultiColorFormatter(logging.Formatter):
    def format(self, record):
        time_color = Fore.LIGHTBLACK_EX
        level_color = {
            'DEBUG': Fore.CYAN,
            'INFO': Fore.GREEN,
            'WARNING': Fore.YELLOW,
            'ERROR': Fore.RED,
            'CRITICAL': Fore.MAGENTA
        }.get(record.levelname, Fore.WHITE)
        name_color = Fore.BLUE
        msg_color = Fore.WHITE

        formatted = (
            f"{time_color}{self.formatTime(record, '%Y-%m-%d %H:%M:%S')}"
            f" {level_color}[{record.levelname}]"
            f" {name_color}{record.name}:"
            f" {msg_color}{record.getMessage()}"
        )
        return formatted


def setup_logging(path: str = "logs/app.log") -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)

    # File formatter
    file_fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    # File handler
    file_h = RotatingFileHandler(
        path, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_h.setFormatter(file_fmt)
    file_h.setLevel(logging.INFO)

    # Console handler with custom formatter
    console_h = logging.StreamHandler()
    console_h.setFormatter(MultiColorFormatter())
    console_h.setLevel(logging.INFO)

    # Root logger
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(logging.INFO)
    root.addHandler(file_h)
    root.addHandler(console_h)



# import os, logging
# from logging.handlers import RotatingFileHandler

# def setup_logging(path: str = "logs/app.log"):
#     os.makedirs(os.path.dirname(path), exist_ok=True)

#     fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

#     file_h = RotatingFileHandler(path, maxBytes=5*1024*1024, backupCount=5, encoding="utf-8")
#     file_h.setFormatter(fmt)
#     file_h.setLevel(logging.INFO)

#     # optional console too
#     console_h = logging.StreamHandler()
#     console_h.setFormatter(fmt)
#     console_h.setLevel(logging.INFO)

#     root = logging.getLogger()
#     root.handlers.clear()         
#     root.setLevel(logging.INFO)
#     root.addHandler(file_h)
#     root.addHandler(console_h)
