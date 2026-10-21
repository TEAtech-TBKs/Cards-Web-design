
/* Course search, category filtering, suggestions, and no-results handling */

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const categorySelect = document.getElementById("categories");
const cardsContainer = document.querySelector(".cards");
const errorMessage = document.getElementById("error-message");

if (searchInput && searchButton && categorySelect && cardsContainer) {
    const cards = Array.from(cardsContainer.querySelectorAll(".card"));

    // Prepare the suggestion dropdown.
    const suggestions = document.createElement("div");

    suggestions.className = "course-suggestions";
    suggestions.id = "course-suggestions";
    suggestions.setAttribute("role", "listbox");
    suggestions.setAttribute("aria-label", "Course suggestions");
    suggestions.hidden = true;

    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("aria-autocomplete", "list");
    searchInput.setAttribute("aria-controls", "course-suggestions");

    searchInput.parentElement.appendChild(suggestions);

    // Keep the no-results message below the course grid.
    if (errorMessage) {
        cardsContainer.insertAdjacentElement(
            "afterend",
            errorMessage.closest(".err-message") || errorMessage
        );

        errorMessage.hidden = true;
        errorMessage.style.display = "none";
    }

    // Normalize text for case-insensitive, accent-insensitive matching.
    function normalize(text) {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    // Read the searchable information from each course card.
    const courses = cards.map((card) => {
        const title = card.querySelector("h3")?.textContent.trim() || "";
        const category =
            card.querySelector(".course-category")?.textContent.trim() || "";
        const description =
            card.querySelector(".description")?.textContent.trim() || "";

        const searchableText = normalize(`${title} ${category} ${description}`);

        return {
            card,
            title,
            category,
            description,
            searchableText,
            normalizedTitle: normalize(title),
            normalizedCategory: normalize(category)
        };
    });

    // Read the selected category's visible label.
    function getSelectedCategory() {
        const option = categorySelect.selectedOptions[0];

        if (!option || !option.value) {
            return "";
        }

        return normalize(option.textContent);
    }

    // Match the selected category to the card category or course title.
    function matchesCategory(course, selectedCategory) {
        if (!selectedCategory) {
            return true;
        }

        // The Cybersecurity card is categorized as "Information Security".
        if (selectedCategory === "cybersecurity") {
            return (
                course.normalizedTitle === "cybersecurity" ||
                course.normalizedCategory === "information security"
            );
        }

        return (
            course.normalizedCategory === selectedCategory ||
            course.normalizedTitle === selectedCategory
        );
    }

    function findCourses(query = "", selectedCategory = "") {
        const searchTerm = normalize(query);

        return courses.filter((course) => {
            const matchesSearch =
                !searchTerm || course.searchableText.includes(searchTerm);

            const matchesSelectedCategory = matchesCategory(
                course,
                selectedCategory
            );

            return matchesSearch && matchesSelectedCategory;
        });
    }

    // Show only courses matching both the search and category filters.
    function filterCourses() {
        const query = searchInput.value;
        const selectedCategory = getSelectedCategory();
        const matchingCourses = findCourses(query, selectedCategory);

        courses.forEach((course) => {
            course.card.hidden = !matchingCourses.includes(course);
        });

        if (errorMessage) {
            const noResults = matchingCourses.length === 0;
            errorMessage.hidden = !noResults;
            errorMessage.style.display = noResults ? "block" : "none";
        }

        return matchingCourses;
    }

    function hideSuggestions() {
        suggestions.hidden = true;
        suggestions.replaceChildren();
    }

    // Show up to six matching course suggestions.
    function showSuggestions() {
        const query = searchInput.value.trim();
        const selectedCategory = getSelectedCategory();

        if (!query && !selectedCategory) {
            hideSuggestions();
            return;
        }

        const matches = findCourses(query, selectedCategory).slice(0, 6);
        suggestions.replaceChildren();

        if (matches.length === 0) {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "course-suggestion-empty";
            emptyMessage.textContent = "No matching courses found.";

            suggestions.appendChild(emptyMessage);
            suggestions.hidden = false;
            return;
        }

        matches.forEach((course) => {
            const option = document.createElement("button");

            option.type = "button";
            option.className = "course-suggestion";
            option.setAttribute("role", "option");

            const title = document.createElement("strong");
            title.textContent = course.title;

            const category = document.createElement("small");
            category.textContent = course.category;

            option.append(title, category);

            option.addEventListener("click", () => {
                searchInput.value = course.title;

                // Clear the category so it cannot hide the selected course.
                categorySelect.value = "";

                hideSuggestions();
                filterCourses();

                course.card.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                searchInput.focus();
            });

            suggestions.appendChild(option);
        });

        suggestions.hidden = false;
    }

    // Live search as the user types.
    searchInput.addEventListener("input", () => {
        filterCourses();
        showSuggestions();
    });

    // Search button.
    searchButton.addEventListener("click", () => {
        hideSuggestions();

        const matchingCourses = filterCourses();

        if (matchingCourses.length > 0) {
            cardsContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });

    // Keyboard support.
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            hideSuggestions();

            const matchingCourses = filterCourses();

            if (matchingCourses.length > 0) {
                cardsContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }

        if (event.key === "Escape") {
            hideSuggestions();
        }
    });

    // Category dropdown.
    categorySelect.addEventListener("change", () => {
        filterCourses();
        showSuggestions();
    });

    // Close suggestions when clicking outside the search area.
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".search")) {
            hideSuggestions();
        }
    });

    // Initialize the cards.
    filterCourses();
}
