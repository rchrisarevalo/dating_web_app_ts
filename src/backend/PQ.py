class Heap:
    def __init__(self):
        self.heap = []
        self.sorted_list = []

    # Used to move the element to the top
    # when "bubbling up" the element.
    def parent(self, i):
        return int((i - 1) / 2)

    # Used to move the element to its
    # left child index when "bubbling
    # down" the element.
    def leftChild(self, i):
        return int((2 * i) + 1)

    # Used to move the element to its
    # right child index when "bubbling
    # down" the element.
    def rightChild(self, i):
        return int((2 * i) + 2)

    # Runs in O(log n) time.
    def insert(self, 
               x, 
               username, 
               interests, 
               first_name, 
               middle_name, 
               last_name, 
               city_residence, 
               state_residence, 
               sexual_orientation, 
               interested_in, 
               uri, 
               relationship_status, 
               gender, 
               height, 
               birth_month, 
               birth_date, 
               birth_year, 
               age):
        
        self.heap.append((x, 
                          username, 
                          interests, 
                          first_name, 
                          middle_name, 
                          last_name, 
                          city_residence, 
                          state_residence, 
                          sexual_orientation, 
                          interested_in, 
                          uri, 
                          relationship_status, 
                          gender, 
                          height, 
                          birth_month, 
                          birth_date, 
                          birth_year, 
                          age))
        
        i = len(self.heap) - 1

        self.bubbleUp(i)

    # Runs in O(1) time.
    def top(self):
        if (len(self.heap) != 0):
            return self.heap[0]
        else:
            return ()

    # Runs in O(log n) time.
    def remove(self):
        # Runs in O(1) time.
        self.sorted_list.append(self.top())
        self.heap[0], self.heap[len(self.heap) - 1] = self.heap[len(self.heap) - 1], self.heap[0]
        self.heap.pop()

        # Runs in O(log n) time.
        self.bubbleDown(0)

    # Runs in O(log n) time.
    def bubbleUp(self, i):
        # Edge case that prevents program from crashing when attempting to use parent function for the sole element in the heap
        # when bubbling up.
        if len(self.heap) > 1:
            if self.heap[i][0] > self.heap[self.parent(i)][0]:
                self.heap[self.parent(i)], self.heap[i] = self.heap[i], self.heap[self.parent(i)]
                i = self.parent(i)
                self.bubbleUp(i)

    # Runs in O(log n) time.
    def bubbleDown(self, i):
        # Just like bubble up, an edge case was implemented so that it could accept a heap with more than 1 element.
        # Unlike bubble up, there are exceptions included in case the index of the left or right child is out of
        # range from the list length.
        if len(self.heap) >= 3:
            try:
                # If the current index priority level is less than the left child and the left child value is greater than the right child value,
                # then swap the current value with the left child value and update the index with the index of the left child that was swapped.
                if self.heap[i][0] < self.heap[self.leftChild(i)][0] and self.heap[self.leftChild(i)][0] > self.heap[self.rightChild(i)][0]:
                    try:
                        self.heap[self.leftChild(i)], self.heap[i] = self.heap[i], self.heap[self.leftChild(i)]
                        i = self.leftChild(i)
                        self.bubbleDown(i)
                    except:
                        return

                # If the current index priority level is less than the right child and the right child value is greater than the left child value,
                # then swap the current value with the right child value and update the index with the index of the right child that was swapped.
                elif self.heap[i][0] < self.heap[self.rightChild(i)][0] and self.heap[self.rightChild(i)][0] > self.heap[self.leftChild(i)][0]:
                    try:
                        self.heap[i], self.heap[self.rightChild(i)] = self.heap[self.rightChild(i)], self.heap[i]
                        i = self.rightChild(i)
                        self.bubbleDown(i)
                    except:
                        return
            except:
                return

        # Additional edge case added if there are only two items in the heap.
        if len(self.heap) == 2:
            # Try block that handles "bubbling down" the element to the left child
            # if the index is not out of range in that area.
            try:
                # Try block if the index is not out of range for the left child.
                try:
                    # If current element is less than the element on the left child,
                    # then...
                    if self.heap[i][0] < self.heap[self.leftChild(i)][0]:
                        # Swap the current value with the left child value.
                        self.heap[self.leftChild(i)], self.heap[i] = self.heap[i], self.heap[self.leftChild(i)]

                        # Update the current index with the left child index.
                        i = self.leftChild(i)

                        # Recursively call function to "bubble down" the element down the heap.
                        self.bubbleDown(i)
                        
                # Exception block if the index is out of range.
                except:
                    return
                    
            # Exception block that handles "bubbling down" the element to its adjacent right child
            # element if the index is not out of range in that area.
            except:
                # Try block if the index is not out of range for the right child.
                try:
                    # If current element is less than the element on the right child,
                    # then...
                    if self.heap[i][0] < self.heap[self.rightChild(i)][0]:
                        # Swap the current value with the right child value.
                        self.heap[i], self.heap[self.rightChild(i)] = self.heap[self.rightChild(i)], self.heap[i]

                        # Update the current index with the right child index.
                        i = self.rightChild(i)

                        # Recursively call function to "bubble down" the element down the heap.
                        self.bubbleDown(i)

                # Exception block if, again, the index is out of range.
                except:
                    return

    # Prints the elements in the heap.
    #
    # Runs in O(1) time.
    def print_heap(self):
        return self.heap
