/**************************
 * Budget Controller
 **************************/
var budgetController = (function() {
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var data = {
        items: {
            income: [],
            expense: []
        },
        totals: {
            income: 0,
            expense: 0
        },
        budget: 0,
        percentage: 0
    };

    var calculateTotal = function(type) {
        var sum = 0;
        data.items[type].forEach(function(item, i) {
            sum += item.value;
        });
        data.totals[type] = sum;
    };

    return {
        addItem: function(type, description, value) {
            var newItem, id, itemsOfType;

            itemsOfType = data.items[type];
            if (itemsOfType.length > 0) {
                id = itemsOfType[itemsOfType.length - 1].id + 1;
            } else {
                id = 0;
            }

            if (type === "income") {
                newItem = new Income(id, description, value);
            } else if (type === "expense") {
                newItem = new Expense(id, description, value);
            }

            itemsOfType.push(newItem);
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;

            ids = data.items[type].map(function(el) {
                return el.id;
            });
            index = ids.indexOf(id);
            if (index !== -1) {
                data.items[type].splice(index, 1);
            }
        },

        calculateBudget: function() {
            // Calculate total income and expenses
            calculateTotal("income");
            calculateTotal("expense");
            // Calculate the budget
            data.budget = data.totals.income - data.totals.expense;
            // Calculate the percentage of income that we spent
            if (data.totals.income > 0) {
                data.percentage = Math.round((data.totals.expense / data.totals.income) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {
            data.items.expense.forEach(function(item) {
                item.calcPercentage(data.totals.income);
            });
        },

        getBudget: function() {
            return {
                totalIncome: data.totals.income,
                totalExpense: data.totals.expense,
                budget: data.budget,
                percentage: data.percentage
            };
        },

        getPercentages: function() {
            var allPercentages = data.items.expense.map(function(item) {
                return item.percentage;
            });
            return allPercentages;
        },

        testing: function() {
            console.log(data);
        }
    };
})();

/**************************
 * UI Controller
 **************************/
var UIController = (function() {
    var DOMstrings = {
        inputType: ".add__type",
        inputDescription: ".add__description",
        inputValue: ".add__value",
        inputBtn: ".add__btn",
        incomeList: ".income__list",
        expensesList: ".expenses__list",
        budgetValue: ".budget__value",
        incomeValue: ".budget__income--value",
        expensesValue: ".budget__expenses--value",
        percentageValue: ".budget__expenses--percentage",
        container: ".container",
        itemPercentageValue: ".item__percentage",
        dateValue: ".budget__title--month"
    };

    var formatNumber = function(number, type) {
        var numSplit, int, dec, rgx, prefix;

        number = Math.abs(number);
        number = number.toFixed(2);

        numSplit = number.split(".");
        int = numSplit[0];
        dec = numSplit[1];

        rgx = /(\d+)(\d{3})/;
        while (rgx.test(int)) {
            int = int.replace(rgx, "$1" + "," + "$2");
        }

        prefix = number == 0 ? "" : type === "income" ? "+ " : "- ";
        return prefix + int + "." + dec;
    };

    return {
        getDOMstrings: function() {
            return DOMstrings;
        },

        changedType: function() {
            document
                .querySelectorAll(DOMstrings.inputType + ", " + DOMstrings.inputDescription + ", " + DOMstrings.inputValue)
                .forEach(function(element) {
                    element.classList.toggle("red-focus");
                });
            document.querySelector(DOMstrings.inputBtn).classList.toggle("red");
        },

        getInput: function() {
            var type, description, value;

            type = document.querySelector(DOMstrings.inputType).value;
            description = document.querySelector(DOMstrings.inputDescription).value;
            value = parseFloat(document.querySelector(DOMstrings.inputValue).value);

            if (type && description !== "" && !isNaN(value) && value > 0) {
                return {
                    type: type,
                    description: description,
                    value: value
                };
            }
        },

        clearFields: function() {
            var fields = document.querySelectorAll(DOMstrings.inputDescription + ", " + DOMstrings.inputValue);
            //var fieldsArr = Array.prototype.slice.call(fields);

            fields.forEach(function(field, i) {
                field.value = "";
            });
            fields[0].focus();
        },

        addListItem: function(item, type) {
            var html, listContainer;

            if (type === "income") {
                listContainer = DOMstrings.incomeList;
                html =
                    '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === "expense") {
                listContainer = DOMstrings.expensesList;
                html =
                    '<div class="item clearfix" id="expense-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            html = html.replace("%id%", item.id);
            html = html.replace("%description%", item.description);
            html = html.replace("%value%", formatNumber(item.value, type));

            document.querySelector(listContainer).insertAdjacentHTML("beforeend", html);
        },

        deleteListItem: function(elementId) {
            var element = document.getElementById(elementId);
            element.parentNode.removeChild(element);
        },

        displayBudget: function(budget) {
            var type = budget.budget > 0 ? "income" : "expense";

            document.querySelector(DOMstrings.budgetValue).textContent = formatNumber(budget.budget, type);
            document.querySelector(DOMstrings.incomeValue).textContent = formatNumber(budget.totalIncome, "income");
            document.querySelector(DOMstrings.expensesValue).textContent = formatNumber(budget.totalExpense, "expense");

            var percentage;
            if (budget.percentage > 0) {
                percentage = budget.percentage + "%";
            } else {
                percentage = "--";
            }
            document.querySelector(DOMstrings.percentageValue).textContent = percentage;
        },

        displayPercentages: function(allPercentages) {
            var items = document.querySelectorAll(DOMstrings.itemPercentageValue);

            items.forEach(function(item, i) {
                if (allPercentages[i] > 0) {
                    item.textContent = allPercentages[i] + "%";
                } else {
                    item.textContent = "--";
                }
            });
        },

        displayDate: function() {
            now = new Date();

            months = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            ];
            month = now.getMonth();
            year = now.getFullYear();

            document.querySelector(DOMstrings.dateValue).textContent = months[month] + " " + year;
        }
    };
})();

/**************************
 * Global App Controller
 **************************/
var controller = (function(budgetCtrl, UICtrl) {
    var setupEventListeners = function() {
        var DOMstrings = UICtrl.getDOMstrings();

        document.querySelector(DOMstrings.inputBtn).addEventListener("click", ctrlAddItem);
        document.addEventListener("keypress", function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });
        document.querySelector(DOMstrings.container).addEventListener("click", ctrlDeleteItem);
        document.querySelector(DOMstrings.inputType).addEventListener("change", UICtrl.changedType);
    };

    var ctrlAddItem = function() {
        var input, newItem;

        // Get input from the UI Controller
        input = UICtrl.getInput();

        if (input) {
            // Add new item through the Budget Controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            // Update the UI with the newly created item
            UICtrl.addListItem(newItem, input.type);
            // Clear the input fields
            UICtrl.clearFields();
            // Calculate and update the budget
            updateBudget();
            // Calculate and update the percentages
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function(event) {
        var itemId, splitId, type, id;

        //Get id of the item we want to delete
        itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if (itemId) {
            splitId = itemId.split("-");
            type = splitId[0];
            id = parseInt(splitId[1]);

            // Remove the item from the data structure
            budgetCtrl.deleteItem(type, id);
            // Remove the item from the UI
            UICtrl.deleteListItem(itemId);
            // Calculate and update the budget
            updateBudget();
            // Calculate and update the percentages
            updatePercentages();
        }
    };

    var updateBudget = function() {
        // Calculate the budget
        budgetCtrl.calculateBudget();
        // Get the budget
        var budget = budgetCtrl.getBudget();
        // Display the budget on the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {
        // Calculate percentages
        budgetCtrl.calculatePercentages();
        // Get percentages from the budget controller
        var allPercentages = budgetCtrl.getPercentages();
        // Update UI with the new percentages
        UICtrl.displayPercentages(allPercentages);
    };

    return {
        init: function() {
            console.log("Application has started.");
            UICtrl.displayDate();
            UICtrl.displayBudget({
                totalIncome: 0,
                totalExpense: 0,
                budget: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };
})(budgetController, UIController);

controller.init();
