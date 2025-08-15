
document.addEventListener("DOMContentLoaded", () => {
    // --------- INITIAL SETUP ---------
    toggleViewMode(false);
    const tbody = document.getElementById("productTableBody");
    const addRowBtn = document.getElementById("addRowBtn");
    const globalSuggestions = document.getElementById("globalSuggestions");
    let activeRow = null;

    function updateSN() {
        tbody.querySelectorAll(".sn").forEach((cell, index) => {
            cell.textContent = index + 1;
        });
    }

    // --------- ADD ROW ---------
    addRowBtn.addEventListener("click", () => {
        const newRow = tbody.rows[0].cloneNode(true);
        newRow.querySelectorAll("input").forEach(inp => inp.value = "");
        newRow.querySelectorAll("select").forEach(sel => sel.value = "");
        tbody.appendChild(newRow);
        updateSN();
        updateRow(newRow);
    });

    // --------- REMOVE ROW ---------
    tbody.addEventListener("click", (e) => {
        if (e.target.classList.contains("removeRow") && tbody.rows.length > 1) {
            e.target.closest("tr").remove();
            updateSN();
            updateSummary();
            updateTaxBreakdown();
        }
    });

    // --------- PRODUCT SUGGESTIONS ---------
    document.addEventListener("input", async (e) => {
        if (e.target.classList.contains("productName")) {
            activeRow = e.target.closest("tr");
            const inputRect = e.target.getBoundingClientRect();
            globalSuggestions.style.left = `${inputRect.left + window.scrollX}px`;
            globalSuggestions.style.top = `${inputRect.bottom + window.scrollY}px`;
            globalSuggestions.style.width = `${inputRect.width}px`;

            const query = e.target.value.trim();
            if (!query) {
                globalSuggestions.style.display = "none";
                return;
            }

            const res = await fetch(`/search-products?q=${encodeURIComponent(query)}`);
            const products = await res.json();

            globalSuggestions.innerHTML = "";
            products.forEach(p => {
                const item = document.createElement("div");
                item.textContent = p.pname;
                item.addEventListener("click", () => {
                    if (activeRow) {
                        activeRow.querySelector(".productName").value = p.pname;
                        activeRow.querySelector(".hsn").value = p.hsn;
                        activeRow.querySelector(".pack").value = p.pack;
                        activeRow.querySelector(".batch").value = p.batch;
                        activeRow.querySelector(".mrp").value = p.mrp;
                        activeRow.querySelector(".rate").value = p.rate;
                        activeRow.querySelector(".value").value = p.value;
                        activeRow.querySelector(".exp").value = p.exp;
                        activeRow.querySelector(".igst").value = p.igst;
                        updateRow(activeRow);
                    }
                    globalSuggestions.style.display = "none";
                });
                globalSuggestions.appendChild(item);
            });

            globalSuggestions.style.display = products.length > 0 ? "block" : "none";
        }
    });

    document.addEventListener("click", (e) => {
        if (!globalSuggestions.contains(e.target) && !e.target.classList.contains("productName")) {
            globalSuggestions.style.display = "none";
        }
    });

    // --------- CALCULATION FUNCTIONS ---------
    function updateRow(row) {
        const qty = parseFloat(row.querySelector(".qty").value) || 0;
        const rate = parseFloat(row.querySelector(".rate").value) || 0;

        // IGST can be text with % symbol
        const igstInput = row.querySelector(".igst");
        let igst = 0;
        if (igstInput) igst = parseFloat(igstInput.value.replace("%","").trim()) || 0;

        const amount = qty * rate;
        const value = (amount * igst) / 100;

        row.querySelector(".amount").value = amount.toFixed(2);
        row.querySelector(".value").value = value.toFixed(2);

        updateSummary();
        updateTaxBreakdown();
    }

    function updateSummary() {
        let subtotal = 0;
        let totalTax = 0;
        let roundoffValue = 0;
        tbody.querySelectorAll("tr").forEach(row => {
            subtotal += parseFloat(row.querySelector(".amount").value) || 0;
            totalTax += parseFloat(row.querySelector(".value").value) || 0;
        });

        document.getElementById("subtotal").value = subtotal.toFixed(2);
        document.getElementById("totalTax").value = totalTax.toFixed(2);
        

        const roundOff = parseFloat(document.getElementById("roundOff").value) || 0;
        const total = subtotal + totalTax + roundOff;

        // --------- ROUND GRAND TOTAL TO NEAREST INTEGER ---------
        const grandTotalRounded = Math.round(total);
        document.getElementById("grandTotal").value = grandTotalRounded.toFixed(2);

        document.getElementById("roundOff").value = Math.abs(((subtotal + totalTax) - grandTotalRounded ).toFixed(2));
    }

    function updateTaxBreakdown() {
        const taxRates = {5:0, 12:0, 18:0, 28:0};
        tbody.querySelectorAll("tr").forEach(row => {
            const amount = parseFloat(row.querySelector(".amount").value) || 0;
            const igstInput = row.querySelector(".igst");
            let igst = 0;
            if(igstInput) igst = parseFloat(igstInput.value.replace("%","").trim()) || 0;
            if(taxRates[igst] !== undefined) taxRates[igst] += amount;
        });

        document.querySelectorAll(".tax-table tbody tr").forEach(row => {
            const rate = parseFloat(row.cells[0].innerText.replace("%","")) || 0;
            if(taxRates[rate] !== undefined){
                const taxableAmount = taxRates[rate];
                const taxAmount = (taxableAmount * rate) / 100;
                row.cells[1].innerText = taxableAmount.toFixed(2);
                row.cells[2].innerText = taxAmount.toFixed(2);
            }
        });

        const totalRow = document.querySelector(".tax-table tbody tr.total-row");
        let totalTaxable = 0, totalTaxAmount = 0;
        for(let r in taxRates){
            totalTaxable += taxRates[r];
            totalTaxAmount += (taxRates[r]*r)/100;
        }
        totalRow.cells[1].innerText = totalTaxable.toFixed(2);
        totalRow.cells[2].innerText = totalTaxAmount.toFixed(2);
    }

    // --------- INPUT & SELECT LISTENERS ---------
    tbody.addEventListener("input", e => {
        const row = e.target.closest("tr");
        if(row) updateRow(row);
    });
    tbody.addEventListener("change", e => {
        const row = e.target.closest("tr");
        if(row) updateRow(row);
    });

    // --------- PARTY SUGGESTIONS ---------
    const partyNameInput = document.getElementById("partyName");
    const partySuggestions = document.getElementById("partySuggestions");

    partyNameInput.addEventListener("input", async () => {
        const query = partyNameInput.value.trim();
        partySuggestions.innerHTML = "";

        if (!query) {
            partySuggestions.style.display = "none";
            return;
        }

        try {
            const res = await fetch(`/search-user?q=${encodeURIComponent(query)}`);
            const users = await res.json();

            users.forEach(user => {
                const item = document.createElement("div");
                item.classList.add("suggestion-item");
                item.textContent = `${user.partyName} — ${user.mobile}`;
                item.addEventListener("click", () => {
                    document.getElementById("partyName").value = user.partyName || "";
                    document.getElementById("partyAddress").value = user.address || "";
                    document.getElementById("partyGSTIN").value = user.gstin || "";
                    document.getElementById("partyMobile").value = user.mobile || "";
                    document.getElementById("partyPAN").value = user.panno || "";
                    document.getElementById("partyEmail").value = user.email || "";
                    partySuggestions.style.display = "none";
                });
                partySuggestions.appendChild(item);
            });

            const rect = partyNameInput.getBoundingClientRect();
            partySuggestions.style.position = "absolute";
            partySuggestions.style.left = `${rect.left + window.scrollX}px`;
            partySuggestions.style.top = `${rect.bottom + window.scrollY}px`;
            partySuggestions.style.width = `${rect.width}px`;
            partySuggestions.style.display = users.length > 0 ? "block" : "none";
        } catch(err){
            console.error(err);
        }
    });

    document.addEventListener("click", e => {
        if(!partyNameInput.contains(e.target) && !partySuggestions.contains(e.target)){
            partySuggestions.style.display = "none";
        }
    });

    // --------- SERIAL NUMBERS ---------
    updateSN();
});

// --------- VIEW MODE & PRINT ---------
function toggleViewMode(isViewMode){
    const viewElements = document.querySelectorAll('.view-mode');
    const editElements = document.querySelectorAll('.edit-mode');
    if(isViewMode){
        editElements.forEach(input => {
            const viewId = input.id + '-view';
            const viewElement = document.getElementById(viewId);
            if(viewElement) viewElement.innerText = input.value;
        });
        viewElements.forEach(el => el.style.display='block');
        editElements.forEach(el => el.style.display='none');
    } else {
        viewElements.forEach(el => el.style.display='none');
        editElements.forEach(el => el.style.display='block');
    }
}

function beforePrint(){
    toggleViewMode(true);
    document.querySelectorAll('.no-print').forEach(el => el.style.display='none');
}

function afterPrint(){
    toggleViewMode(false);
    document.querySelectorAll('.no-print').forEach(el => el.style.display='');
}

function printInvoice(){
    beforePrint();
    window.print();
    afterPrint();
}

function saveInvoice() {
    beforePrint();
    
    const invoice = document.getElementById("invoiceContent");

    const cparty = document.getElementById("challan-party");
    const cpartyname = cparty.querySelector(".hm").value.toUpperCase();

    // Generate timestamp
    const now = new Date();
    // Format: YYYY-MM-DDTHHMMSS.mmm
    const timestamp = now.getFullYear() + '-' +
                      String(now.getMonth()+1).padStart(2,'0') + '-' +
                      String(now.getDate()).padStart(2,'0')

    const options = {
        margin: 0.2,
        filename: `${cpartyname} - ${timestamp}.pdf`,
        image: { type:'jpeg', quality:0.98 },
        html2canvas: { scale:2, useCORS:true, y:0, scrollY:0 },
        jsPDF: { unit:'in', format:'a4', orientation:'portrait' }
    };

    html2pdf().from(invoice).set(options).save().then(() => afterPrint());
}



// Script TO HANDLE ROW ADD AND REMOVE IN PRODUCT FORM 

// let productIndex = 1;

//     document.getElementById("addRowBtn").addEventListener("click", function () {
//         const tableBody = document.getElementById("productTableBody");

//         const newRow = `
//             <tr>
//                 <td><input type="text" name="products[${productIndex}][hsn]" class="form-control" required></td>
//                 <td><input type="text" name="products[${productIndex}][pname]" class="form-control" required></td>
//                 <td><input type="text" name="products[${productIndex}][pack]" class="form-control"></td>
//                 <td><input type="text" name="products[${productIndex}][batch]" class="form-control"></td>
//                 <td><input type="month" name="products[${productIndex}][exp]" class="form-control"></td>
//                 <td><input type="number" step="0.01" name="products[${productIndex}][mrp]" class="form-control"></td>
//                 <td><input type="number" step="0.01" name="products[${productIndex}][rate]" class="form-control"></td>
//                 <td><input type="number" step="0.01" name="products[${productIndex}][igst]" class="form-control"></td>
//                 <td><button type="button" class="btn btn-danger btn-sm remove-row">X</button></td>
//             </tr>
//         `;

//         tableBody.insertAdjacentHTML("beforeend", newRow);
//         productIndex++;
//     });

//     document.getElementById("productTableBody").addEventListener("click", function (e) {
//         if (e.target.classList.contains("remove-row")) {
//             e.target.closest("tr").remove();
//         }
//     });