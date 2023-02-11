import {TransactionStore} from "firefly-iii-typescript-sdk-fetch";
import {runOnURLMatch} from "../common/buttons";
import {AutoRunState} from "../background/auto_state";
import {getCurrentPageAccount, scrapeTransactionsFromPage} from "./scrape/transactions";
import {PageAccount} from "../common/accounts";
import {runOnContentChange} from "../common/autorun";
import {backToAccountsPage} from "./auto_run/transactions";
import {isSingleAccountBank} from "../extensionid";
import {getButtonDestination} from "./scrape/accounts";

interface TransactionScrape {
    pageAccount: PageAccount;
    pageTransactions: TransactionStore[];
}

let pageAlreadyScraped = false;

async function doScrape(isAutoRun: boolean): Promise<TransactionScrape> {
    if (isAutoRun && pageAlreadyScraped) {
        throw new Error("Already scraped. Stopping.");
    }

    const accounts = await chrome.runtime.sendMessage({
        action: "list_accounts",
    });
    const acct = await getCurrentPageAccount(accounts);
    const txs = scrapeTransactionsFromPage(acct);
    pageAlreadyScraped = true;
    await chrome.runtime.sendMessage({
            action: "store_transactions",
            is_auto_run: isAutoRun,
            value: txs,
        },
        () => {
        });
    if (isSingleAccountBank) {
        await chrome.runtime.sendMessage({
            action: "complete_auto_run_state",
            state: AutoRunState.Transactions,
        });
    }
    return {
        pageAccount: {
            accountNumber: acct.attributes.accountNumber!,
            name: acct.attributes.name,
            id: acct.id,
        },
        pageTransactions: txs,
    };
}

const buttonId = 'firefly-iii-export-transactions-button';

function addButton() {
    const button = document.createElement("button");
    button.id = buttonId;
    button.textContent = "Firefly III"
    button.addEventListener("click", async () => doScrape(false), false);
    button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")
    getButtonDestination().append(button);
}

function enableAutoRun() {
    chrome.runtime.sendMessage({
        action: "get_auto_run_state",
    }).then(state => {
        if (state === AutoRunState.Transactions) {
            doScrape(true)
                .then((id: TransactionScrape) => {
                    if (isSingleAccountBank) {
                        return chrome.runtime.sendMessage({
                            action: "complete_auto_run_state",
                            state: AutoRunState.Transactions,
                        })
                    } else {
                        return chrome.runtime.sendMessage({
                            action: "increment_auto_run_tx_account",
                            lastAccountNameCompleted: id.pageAccount.name,
                        }).then(() => backToAccountsPage())
                    }
                });
        }
    });
}

const txPage = 'Transactions/History';

// If your manifest.json allows your content script to run on multiple pages,
// you can call this function more than once, or set the urlPath to "".
runOnURLMatch(
    txPage,
    () =>
        () => {
            if (!document.getElementById(buttonId)) {
                pageAlreadyScraped = false;
                addButton();
            }
        },
)

runOnContentChange(
    txPage,
    enableAutoRun,
)
