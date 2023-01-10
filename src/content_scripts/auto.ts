import {AutoRunState} from "../common/auto";

function buildCol() {
    const col = document.createElement("td");
    col.style.width = "40px";
    col.style.background = "white";
    col.style.height = "100%";
    return col;
}

window.addEventListener("load", function (event) {
    // TODO: Don't show this component if auto run is off
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.right = "0";
    container.style.height = "20px";

    const table = document.createElement("table")
    table.style.margin = "0 auto";
    table.style.height = "100%";

    const acctCol = buildCol();
    const txCol = buildCol();
    const doneCol = buildCol();

    table.append(acctCol, txCol, doneCol)

    container.append(table);
    document.body.append(container);

    const updateProgressBar = () => {
        chrome.runtime.sendMessage({
            action: "get_auto_run_state",
        }).then(
            state => {
                acctCol.style.background = "white";
                txCol.style.background = "white";
                doneCol.style.background = "white";
                if (state === AutoRunState.Accounts) {
                    acctCol.style.background = "blue";
                } else if (state === AutoRunState.Transactions) {
                    acctCol.style.background = "blue";
                    txCol.style.background = "blue";
                } else if (state === AutoRunState.Done) {
                    acctCol.style.background = "blue";
                    txCol.style.background = "blue";
                    doneCol.style.background = "blue";
                }
            }
        )
    }
    updateProgressBar();

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action !== "update_auto_run_progress") {
            return false;
        }
        updateProgressBar();
        return true;
    })
});