export const CalculateBirthday = (birthMonth: string, birthDate: number, birthYear: number): number => {
    // Step 1: Set up dictionary containing the index values in correspondence
    // with the month values pre-defined in JavaScript.
    const birthday_month: Record<string, number> = {
        "January": 0,
        "February": 1,
        "March": 2,
        "April": 3,
        "May": 4,
        "June": 5,
        "July": 6,
        "August": 7,
        "September": 8,
        "October": 9,
        "November": 10,
        "December": 11
    }

    // Step 2: Provide formula that will use the user's birthday information to
    // determine their age.
    const user_birthday: Date = new Date(birthYear, birthday_month[birthMonth], birthDate)
    const expected_birthday: Date = new Date(new Date().getFullYear(), birthday_month[birthMonth], birthDate)
    const age_ms: number = expected_birthday.getTime() - user_birthday.getTime()
    let age: number = Math.round(age_ms * (0.001 / 1) * (1 / 60) * (1 / 60) * (1 / 24) * (1 / 365))

    const current_date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())

    // Step 3: The final step is to determine whether the user's birthday has already occurred or is about
    // to occur. For the former case, simply return the age. For the latter case, decrement the age by 1
    // and return the new value.
    if (current_date < expected_birthday) {
        age -= 1
        return age
    } else {
        return age
    }
}