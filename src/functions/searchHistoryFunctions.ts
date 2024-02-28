export const insertSearchTerm = () => {
    const search_term = (document.getElementById("search-input") as HTMLInputElement).value

    if (search_term) {
        fetch('http://localhost:5000/insert_search_history', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                search_term: search_term
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.ok) {
                return res.json()
            } else {
                throw res.status
            }
        }).then((data) => {
            console.log(data)
        }).catch((error) => {
            console.log(error)
        })
    }
}

export const clearSearchTerm = (i: number, setSearchHistoryList: React.Dispatch<React.SetStateAction<{search_term: string}[]>>) => {
    const search_term = (document.getElementById(`search-term-${i}`) as HTMLInputElement).value
    
    fetch(`http://localhost:5000/clear_search_history_term?search_term=${search_term}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((res) => {
        if (res.ok) {
            return res.json()
        } else {
            throw res.status
        }
    }).then((data) => {
        setSearchHistoryList(data)
    })
}