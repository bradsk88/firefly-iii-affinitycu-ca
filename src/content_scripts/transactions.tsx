import {TransactionStore} from "firefly-iii-typescript-sdk-fetch";
import {runOnURLMatch} from "../common/buttons";
import {AutoRunState} from "../background/auto_state";
import {getCurrentPageAccount, scrapeTransactionsFromPage} from "./scrape/transactions";
import {PageAccount} from "../common/accounts";

interface TransactionScrape {
    pageAccount: PageAccount;
    pageTransactions: TransactionStore[];
}

async function doScrape(): Promise<TransactionScrape> {
    const accounts = await chrome.runtime.sendMessage({
        action: "list_accounts",
    });
    const id = await getCurrentPageAccount(accounts);
    const txs = scrapeTransactionsFromPage(id.id);
    chrome.runtime.sendMessage({
            action: "store_transactions",
            value: txs,
        },
        () => {
        });
    return {
        pageAccount: id,
        pageTransactions: txs,
    };
}

const buttonId = 'firefly-iii-export-transactions-button';

function addButton() {
    const button = document.createElement("button");
    button.textContent = "Firefly III"
    button.addEventListener("click", async () => doScrape(), false);
    button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")
    document.body.append(button);
}

function enableAutoRun() {
    chrome.runtime.sendMessage({
        action: "get_auto_run_state",
    }).then(state => {
        if (state === AutoRunState.Transactions) {
            doScrape()
                .then((id: TransactionScrape) => chrome.runtime.sendMessage({
                    action: "increment_auto_run_tx_account",
                    lastAccountNameCompleted: id.pageAccount.name,
                }, () => {
                }));
        }
    });
}

// If your manifest.json allows your content script to run on multiple pages,
// you can call this function more than once, or set the urlPath to "".
runOnURLMatch(
    'Transactions/History',
    () => !!document.getElementById(buttonId),
    () => {
        addButton();
        enableAutoRun();
    },
)
