# User Stories

## Epic: User Onboarding & Setup

### User Story 1: Account creation
As a new user
I want to create an account
So that my calorie data is saved and accessible across devices

**Acceptance Criteria**
- User can sign up using email + password
- Password must meet minimum security rules
- User receives confirmation that the account was created
- User is automatically logged in after successful signup
- Errors are shown for invalid email or weak password

### User Story 2: Profile setup
As a user
I want to set up my profile
So that my calorie goals are personalized

**Acceptance Criteria**
- User can enter age, height, weight, and gender
- User can select activity level
- User can choose a goal (lose, maintain, gain weight)
- App calculates and displays daily calorie target
- User can skip setup and complete it later

## Epic: Food Logging

### User Story 3: Log a meal
As a user
I want to log what I eat
So that I can track my calorie intake

**Acceptance Criteria**
- User can add a food item with name and calories
- User can select meal type (breakfast, lunch, dinner, snack)
- Entry is saved with date and time
- Daily calorie total updates immediately
- User can edit or delete a logged item

### User Story 4: Search food database
As a user
I want to search for foods
So that logging meals is fast and easy

**Acceptance Criteria**
- User can search by food name
- Results appear as the user types
- Food items show calories per serving
- User can select a food and adjust portion size
- Calories update based on portion size

### User Story 5: Quick add calories
As a user
I want to quickly add calories
So that I can log meals when I’m in a hurry

**Acceptance Criteria**
- User can enter calories without selecting a food
- Entry requires a meal type
- Entry appears in daily log
- Calories count toward daily total

## Epic: Daily Tracking & Insights

### User Story 6: View daily summary
As a user
I want to see my daily calorie summary
So that I know how I’m doing against my goal

**Acceptance Criteria**
- Daily view shows consumed calories
- Daily view shows remaining calories
- Progress bar visually represents goal completion
- Summary updates in real time as food is logged

### User Story 7: View weekly trends
As a user
I want to see my weekly calorie trends
So that I can understand my habits over time

**Acceptance Criteria**
- User can switch between daily and weekly views
- Weekly view shows total calories per day
- Average daily calories are displayed
- Data updates when past entries are edited

## Epic: Goals & Motivation

### User Story 8: Adjust calorie goal
As a user
I want to change my calorie goal
So that it matches my current lifestyle or progress

**Acceptance Criteria**
- User can manually edit daily calorie goal
- App recalculates remaining calories immediately
- Historical data remains unchanged
- New goal applies from the selected date forward

### User Story 9: Receive reminders
As a user
I want reminders to log my meals
So that I don’t forget to track calories

**Acceptance Criteria**
- User can enable or disable reminders
- User can choose reminder times
- Notifications trigger at scheduled times
- Tapping a reminder opens the food log screen

## Epic: History & Data Management

### User Story 10: View food history
As a user
I want to see my past food entries
So that I can review or reuse meals

**Acceptance Criteria**
- User can browse entries by date
- Past entries show food name, calories, and meal type
- User can copy a past meal to today
- User can edit or delete historical entries

### User Story 11: Data persistence
As a user
I want my data to be saved automatically
So that I never lose my calorie history

**Acceptance Criteria**
- Data is saved after every change
- User data syncs across devices when logged in
- App handles offline usage and syncs when online

## Epic: Macronutrient Tracking

### User Story 12: View macro breakdown per day
As a user
I want to see my daily macronutrient breakdown
So that I can balance protein, fat, and carbs

**Acceptance Criteria**
- Daily summary displays protein, fat, and carbs
- Macros are shown in grams
- Macro values update in real time as food is logged
- Macro totals reflect all meals for the selected day

### User Story 13: View macro goals
As a user
I want to have macronutrient targets
So that my diet aligns with my goals

**Acceptance Criteria**
- App calculates default macro targets based on calorie goal
- Macro targets include protein, fat, and carbs
- User can see remaining macros for the day
- Macro goals are visible alongside calorie goals

### User Story 14: Customize macro targets
As a user
I want to customize my macro targets
So that they match my dietary preferences

**Acceptance Criteria**
- User can manually adjust protein, fat, and carb targets
- Changes validate that macros align with total calories
- Updated macro targets apply immediately
- Historical macro data remains unchanged

### User Story 15: Log food with macros
As a user
I want foods to include macronutrients
So that macro tracking is automatic

**Acceptance Criteria**
- Food entries include protein, fat, and carbs
- Macros scale automatically with portion size
- Manual food entries require calorie input
- Macros default to zero for foods without macro data

### User Story 16: View macro distribution per meal
As a user
I want to see macros per meal
So that I can distribute nutrients throughout the day

**Acceptance Criteria**
- Each meal shows protein, fat, and carbs totals
- User can expand a meal to see macros per food item
- Meal-level macro totals update when items are edited

## Epic: Insights & Visualization

### User Story 17: Macro progress visualization
As a user
I want visual indicators for macro progress
So that it’s easy to understand my intake at a glance

**Acceptance Criteria**
- App shows progress bars or charts for each macro
- Visuals indicate under, on-track, or over target
- Colors are consistent and accessible
- Visuals update in real time

### User Story 18: Weekly macro trends
As a user
I want to see weekly macro trends
So that I can spot imbalances over time

**Acceptance Criteria**
- Weekly view shows average protein, fat, and carbs
- User can switch between calorie and macro views
- Trends update when historical entries are edited

## Epic: Quick & Flexible Logging

### User Story 19: Quick add macros
As a user
I want to quickly add macros
So that I can log custom or homemade meals

**Acceptance Criteria**
- User can enter calories, protein, fat, and carbs manually
- App validates that macros match calories (with tolerance)
- Entry appears in the selected meal
- Totals update immediately

## Epic: Data Integrity

### User Story 20: Macro-calorie consistency validation
As a user
I want macro and calorie values to be validated
So that my tracking stays accurate

**Acceptance Criteria**
- App checks macro calories (4/4/9 rule)
- User is warned if values are inconsistent
- User can still save with confirmation
- System does not auto-correct user-entered data
