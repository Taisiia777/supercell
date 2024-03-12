import logging
import os
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)
SELENIUM_WAITING_TIMEOUT = 5

# WEBPAGE_URL = "https://the-internet.herokuapp.com"
# COOKIE_AGREE_XPATH = ''
# SUPERCELL_LOGIN_XPATH = '/html/body/div[2]/div/ul/li[21]/a'
# EMAIL_XPATH = '//*[@id="username"]'
# BUTTON_XPATH = '/html/body/div[2]/div/div/form/button'

WEBPAGE_URL = "https://store.supercell.com/ru"
COOKIE_AGREE_XPATH = '//*[@id="onetrust-accept-btn-handler"]'
SUPERCELL_LOGIN_XPATH = "/html/body/div[1]/div/div[1]/div/header/div/div[2]/a"
EMAIL_XPATH = "/html/body/div[1]/div/main/div/div/div/div/div/div[2]/div/div/div/div[2]/div/div/form/div[1]/div[2]/input"  # noqa
BUTTON_XPATH = "/html/body/div[1]/div/main/div/div/div/div/div/div[2]/div/div/div/div[2]/div/div/form/div[2]/button[1]"  # noqa


def get_driver():
    service = Service(ChromeDriverManager().install())
    options = Options()
    options.add_argument("--no-sandbox")
    if os.getenv("IS_HEADLESS"):
        options.add_argument("--headless")

    return webdriver.Chrome(service=service, options=options)


def agree_with_cookie(driver):
    try:
        cookie_button = WebDriverWait(driver, SELENIUM_WAITING_TIMEOUT).until(
            EC.element_to_be_clickable((By.XPATH, COOKIE_AGREE_XPATH))
        )
        if cookie_button:
            cookie_button.click()
    except Exception as err:
        logger.exception(err)


def request_the_code(email: str) -> bool:
    try:
        driver = get_driver()
        driver.get(WEBPAGE_URL)
        agree_with_cookie(driver)
        login_button = WebDriverWait(driver, SELENIUM_WAITING_TIMEOUT).until(
            EC.element_to_be_clickable((By.XPATH, SUPERCELL_LOGIN_XPATH))
        )
        time.sleep(0.5)
        login_button.click()
        agree_with_cookie(driver)
        email_field = WebDriverWait(driver, SELENIUM_WAITING_TIMEOUT).until(
            EC.presence_of_element_located((By.XPATH, EMAIL_XPATH))
        )
        time.sleep(2)
        email_field.send_keys(email)
        time.sleep(5)
        signin_button = WebDriverWait(driver, SELENIUM_WAITING_TIMEOUT).until(
            EC.element_to_be_clickable((By.XPATH, BUTTON_XPATH))
        )
        signin_button.click()
        time.sleep(2)
        logger.info(f"Successfully requested for {email}")
        return True
    except Exception as err:
        logger.exception(err)
        return False
