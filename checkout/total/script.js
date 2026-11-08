
let products = [
    { name: "Milk", price: 250, barcode: "1001" },
    { name: "Bread", price: 180, barcode: "1002" },
    { name: "Juice", price: 150, barcode: "1003" },
    { name: "Biscuits", price: 100, barcode: "1004" }
];

let cart = [];
let total = 0;
let subtotal = 0;
let discount = 0;

// Show available products
function showProducts() {
    let html = "";

    products.forEach((product, index) => {
        html += `
            <div class="product">
                <span>${product.name} - Rs. ${product.price}</span>

                <button onclick="addToCart(${index})">Add</button>

                <button onclick="editPrice(${index})">Edit Price</button>

                <button onclick="deleteProduct(${index})">Delete</button>
            </div>
        `;
    });

    document.getElementById("productList").innerHTML =
        html || "No available products.";
}

// Add new product
function addProduct() {
    let name = document.getElementById("newName").value.trim();
    let price = Number(document.getElementById("newPrice").value);
    let barcode = document.getElementById("newBarcode").value.trim();

    if (!name || price <= 0 || !barcode) {
        alert("Please enter all product details!");
        return;
    }

    if (products.some(p => p.barcode === barcode)) {
        alert("Barcode already exists!");
        return;
    }

    products.push({ name, price, barcode });

    showProducts();

    document.getElementById("newName").value = "";
    document.getElementById("newPrice").value = "";
    document.getElementById("newBarcode").value = "";

    alert("Product added successfully!");
}

// Edit product price
function editPrice(index) {
    let newPrice = prompt(
        "Enter new price for " + products[index].name,
        products[index].price
    );

    if (newPrice === null || newPrice.trim() === "") {
        return;
    }

    newPrice = Number(newPrice);

    if (newPrice <= 0 || !Number.isFinite(newPrice)) {
        alert("Please enter a valid price!");
        return;
    }

    let barcode = products[index].barcode;

    products[index].price = newPrice;

    let item = cart.find(p => p.barcode === barcode);

    if (item) {
        item.price = newPrice;
    }

    showProducts();
    updateCart();

    alert("Price updated successfully!");
}

// Delete available product
function deleteProduct(index) {
    let product = products[index];

    if (!confirm("Delete " + product.name + " from products?")) {
        return;
    }

    cart = cart.filter(
        item => item.barcode !== product.barcode
    );

    products.splice(index, 1);

    showProducts();
    updateCart();

    alert("Product deleted successfully!");
}

// Add product to cart
function addToCart(index) {
    let product = products[index];

    let item = cart.find(
        p => p.barcode === product.barcode
    );

    if (item) {
        item.quantity++;
    } else {
        cart.push({
            name: product.name,
            price: product.price,
            barcode: product.barcode,
            quantity: 1
        });
    }

    updateCart();
}

// Increase quantity
function increaseQuantity(index) {
    cart[index].quantity++;
    updateCart();
}

// Decrease quantity
function decreaseQuantity(index) {
    cart[index].quantity--;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCart();
}

// Remove cart item
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// Barcode input
document.getElementById("barcodeInput").addEventListener(
    "keydown",
    function(event) {
        if (event.key === "Enter") {
            let code = this.value.trim();

            let index = products.findIndex(
                p => p.barcode === code
            );

            if (index !== -1) {
                addToCart(index);
            } else {
                alert("Product not found!");
            }

            this.value = "";
        }
    }
);

// Apply discount
function applyDiscount() {
    let value = Number(
        document.getElementById("discountInput").value
    );

    if (value < 0 || value > 100) {
        alert("Discount must be between 0 and 100!");
        return;
    }

    discount = value;
    updateCart();
}

// Update cart and bill
function updateCart() {
    let html = "";
    subtotal = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;

        subtotal += itemTotal;

        html += `
            <div class="cart-item">
                <span>${item.name} x ${item.quantity}</span>

                <button onclick="decreaseQuantity(${index})">−</button>

                <button onclick="increaseQuantity(${index})">+</button>

                <button onclick="removeFromCart(${index})">Remove</button>

                <span>Rs. ${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    let discountAmount = subtotal * discount / 100;

    total = subtotal - discountAmount;

    document.getElementById("cart").innerHTML =
        cart.length ? html : "No products added yet.";

    document.getElementById("subtotal").textContent =
        subtotal.toFixed(2);

    document.getElementById("discountAmount").textContent =
        discountAmount.toFixed(2);

    document.getElementById("total").textContent =
        total.toFixed(2);

    calculateChange();
}

// Calculate change
function calculateChange() {
    let cash = Number(document.getElementById("cash").value);

    let change = cash - total;

    document.getElementById("change").textContent =
        change >= 0 ? change.toFixed(2) : "0.00";
}

// Cash input
document.getElementById("cash").addEventListener(
    "input",
    calculateChange
);

// Print bill
function printBill() {
    if (cart.length === 0) {
        alert("Please add products first!");
        return;
    }

    let cash = Number(document.getElementById("cash").value);

    if (cash < total) {
        alert("Insufficient cash!");
        return;
    }

    window.print();
}

// New customer
function clearCart() {
    cart = [];
    total = 0;
    subtotal = 0;
    discount = 0;

    document.getElementById("cash").value = "";
    document.getElementById("discountInput").value = "";

    updateCart();
}

// Start POS
showProducts();
updateCart();

