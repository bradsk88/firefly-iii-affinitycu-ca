import React from "react";
import {
    AccountRoleProperty,
    AccountStore,
    ShortAccountTypeProperty
} from "firefly-iii-typescript-sdk-fetch/dist/models";
import {sha512} from "js-sha512";
import {AutoRunState} from "./common/auto";
import {addButtonOnURLMatch} from "./common/buttons";

function getAccountButtons(): HTMLButtonElement[] {
    const forms = document.querySelectorAll('form[action="/Transactions/History"]');
    return Array.from(forms.values()).map(v => v.getElementsByTagName("button")[0]);
}

function getAccountNumber(
    button: HTMLButtonElement,
): string {
    const input = button.getElementsByTagName("input")[0];

    let accountNumber = input.attributes.getNamedItem('value')!.value;
    return sha512(accountNumber);
}

function getAccountName(
    button: HTMLButtonElement,
): string {
    return button.attributes.getNamedItem('aria-label')!.value.split('Transaction History for ')[1]
}

function scrapeAccounts(): AccountStore[] {
    return getAccountButtons().map(button => {
        const accountNumber = getAccountNumber(button)
        const as: AccountStore = {
            // TODO: Can we identify these?
            // iban: "12468",
            // bic: "889",
            name: button.attributes.getNamedItem('aria-label')!.value.split('Transaction History for ')[1],
            accountNumber: accountNumber,
            type: ShortAccountTypeProperty.Asset,
            accountRole: AccountRoleProperty.DefaultAsset,
            currencyCode: "CAD",
        };
        return as;
    });
}

function findNextButton(accountName: string): HTMLButtonElement | undefined {
    let foundScraped = false;
    for (const button of getAccountButtons()) {
        if (!accountName) {
            chrome.runtime.sendMessage({
                "message": "returning first button because account number is empty"
            })
            return button;
        }
        if (foundScraped) {
            chrome.runtime.sendMessage({
                "message": "returning row after found"
            })
            return button;
        }
        if (getAccountName(button) === accountName) {
            chrome.runtime.sendMessage({
                "message": "found row"
            })
            foundScraped = true;
        }
    }
}

function openAccountForAutoRun() {
    chrome.runtime.sendMessage({action: "get_auto_run_tx_last_account"})
        .then(account => findNextButton(account))
        .then(button => {
            if (!button) {
                chrome.runtime.sendMessage({
                    action: "complete_auto_run_state",
                    state: AutoRunState.Transactions,
                });
            } else {
                button?.click()
            }
        });
}

let lastUrl: string;

addButtonOnURLMatch(
    'Accounts/Summary',
    () => false,
    () => {
        const button = document.createElement("button");
        button.textContent = "Export to Firefly III"
        const doScrape = async () => {
            const accts = scrapeAccounts();
            chrome.runtime.sendMessage(
                {
                    action: "store_accounts",
                    value: accts,
                },
                () => {
                }
            );
        }

        chrome.runtime.sendMessage({
            action: "get_auto_run_state",
        }).then(state => {
            if (state === AutoRunState.Accounts) {
                doScrape().then(() => chrome.runtime.sendMessage({
                    action: "complete_auto_run_state",
                    state: AutoRunState.Accounts,
                }));
            } else if (state === AutoRunState.Transactions) {
                openAccountForAutoRun();
            }
        });

        button.addEventListener("click", async () => doScrape(), false);
        button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")
        document.getElementsByClassName('content-main-header main-header-related')[0]?.append(button);
    });
