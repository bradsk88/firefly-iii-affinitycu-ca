import React from "react";
import {
    AccountRoleProperty,
    AccountStore,
    ShortAccountTypeProperty
} from "firefly-iii-typescript-sdk-fetch/dist/models";
import {sha512} from "js-sha512";
import {AutoRunState} from "./common/auto";

function scrapeAccounts(): AccountStore[] {
    const forms = document.querySelectorAll('form[action="/Transactions/History"]');
    return Array.from(forms.values()).map(v => {
        const button = v.getElementsByTagName("button")[0];
        const input = button.getElementsByTagName("input")[0];


        let accountNumber = input.attributes.getNamedItem('value')!.value;
        accountNumber = sha512(accountNumber);
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

window.addEventListener("load",function(event) {
    const button = document.createElement("button");
    button.textContent = "Export to Firefly III"
    const doScrape = () => {
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
            doScrape();
            chrome.runtime.sendMessage({
                action: "complete_auto_run_state",
                state: AutoRunState.Accounts,
            })
            window.close();
        }
    });

    button.addEventListener("click", () => doScrape(), false);
    button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")
    document.getElementsByClassName('content-main-header main-header-related')[0]?.append(button);
});
