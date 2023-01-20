import {OpeningBalance} from "../background/firefly_export";

// TODO: You will need to update manifest.json so this file will be loaded on
//  the correct URL.

function scrapeOpeningBalanceFromPage(): OpeningBalance {
    // TODO: This is where you implement the scraper to pull the opening
    //  balance from the page
    return {} as never as OpeningBalance;
}

window.addEventListener("load",function(event) {
    const button = document.createElement("button");
    button.textContent = "Export Opening Balance"
    button.addEventListener("click", () => {
        const openingBalance = scrapeOpeningBalanceFromPage();
        chrome.runtime.sendMessage(
            {
                action: "store_opening",
                value: openingBalance,
            },
            () => {}
        );
    }, false);
    button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")

    const disclaimer = document.createElement("div")
    disclaimer.innerHTML = "" +
        "<div>This will set the opening balance of the account using the last transaction on this page.</div>" +
        "<div>After setting the opening balance, you should not import any earlier transactions.</div>";
    // TODO: Make this work by automatically setting the opening balance during the page scrape (transactions.tsx)

    document.getElementsByClassName('content-main')[0]?.append(button, disclaimer);
});
