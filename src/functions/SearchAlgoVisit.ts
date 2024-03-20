type UserVisitRecord = {
    name: string,
    similarity: number,
    visits: number
}

type MatchRecord = {
    name: string,
    similarity: number
}

const intersection = (set1: Set<string>, set2: Set<string>): Set<string> => {
    // Turns any data type into array where possible.
    const intersection_array: Array<string> = Array.from(set1).filter(elem => set2.has(elem))

    // Convert array into set.
    const intersection_set: Set<string> = new Set(intersection_array.map((elem: string) => elem))

    return intersection_set
}

const visited_users: UserVisitRecord[] = [
    {
        "name": "Ruben",
        "similarity": 0.85,
        "visits": 20
    },
    {
        "name": "Jackie",
        "similarity": 0.98,
        "visits": 19
    },
]

const matches: MatchRecord[] = [
    {
        "name": "Ruben",
        "similarity": 0.85,
    },
    {
        "name": "Jackie",
        "similarity": 0.98,
    },
    {
        "name": "Luisana",
        "similarity": 0.91
    },
    {
        "name": "Doggie",
        "similarity": 0.94
    },
    {
        "name": "Katherine",
        "similarity": 0.81
    }
]

const set1: Set<string> = new Set(visited_users.map((v: UserVisitRecord) => v["name"]))
const set2: Set<string> = new Set(matches.map((m: MatchRecord) => m["name"]))

let most_visited_users: Array<UserVisitRecord> = []
let matched_users: Array<MatchRecord> = []

matches.forEach((u: MatchRecord) => {
    if (!intersection(set1, set2).has(u.name)) {
        matched_users.push(u)
    }
})

visited_users.forEach((u: UserVisitRecord) => {
    if (intersection(set1, set2).has(u.name)) {
        most_visited_users.push(u)
    }
})

most_visited_users = visited_users.sort((a: UserVisitRecord, b: UserVisitRecord) => b.visits - a.visits)
matched_users = matched_users.sort((a: MatchRecord, b: MatchRecord) => b.similarity - a.similarity)
const copy_most_visited_users: MatchRecord[] = most_visited_users.map((user: UserVisitRecord) => {
    return {
        name: user.name,
        similarity: user.similarity
    }
})
let final_matches: MatchRecord[] = []
final_matches = final_matches.concat(copy_most_visited_users, matched_users)
console.log(final_matches)