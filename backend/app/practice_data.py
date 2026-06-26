"""
practice_data.py
----------------
Topic-wise LeetCode-style problems for the Practice Arena.

To guarantee every problem is solvable, we DON'T hardcode expected outputs.
Instead each problem ships with a correct `ref` (reference solution) and a list
of `inputs`; the expected output for each test is COMPUTED from `ref` at import
time. The reference solution is never sent to the browser.

Each public problem dict has:
  slug, title, topic, difficulty, description, examples, constraints,
  function_name, starter {python, javascript}, tests [{input, output}]
"""

import copy
from math import gcd as _math_gcd


# ── helpers ───────────────────────────────────────────────────────────
def _starter(fn, params):
    args = ", ".join(params)
    return {
        "python": f"def {fn}({args}):\n    # write your code here\n    pass\n",
        "javascript": f"function {fn}({args}) {{\n  // write your code here\n}}\n",
    }


def _jsonify(v):
    if isinstance(v, (list, tuple)):
        return [_jsonify(x) for x in v]
    return v


# ── reference solutions (used only to compute expected outputs) ───────
def _two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []


def _max_sub_array(nums):
    best = cur = nums[0]
    for n in nums[1:]:
        cur = max(n, cur + n)
        best = max(best, cur)
    return best


def _contains_duplicate(nums):
    return len(set(nums)) != len(nums)


def _move_zeroes(nums):
    out = [n for n in nums if n != 0]
    return out + [0] * (len(nums) - len(out))


def _max_profit(prices):
    lo, best = float("inf"), 0
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best


def _single_number(nums):
    x = 0
    for n in nums:
        x ^= n
    return x


def _majority_element(nums):
    count = cand = 0
    for n in nums:
        if count == 0:
            cand = n
        count += 1 if n == cand else -1
    return cand


def _product_except_self(nums):
    n = len(nums)
    res = [1] * n
    pre = 1
    for i in range(n):
        res[i] = pre
        pre *= nums[i]
    suf = 1
    for i in range(n - 1, -1, -1):
        res[i] *= suf
        suf *= nums[i]
    return res


def _rotate(nums, k):
    if not nums:
        return []
    k %= len(nums)
    return nums[-k:] + nums[:-k] if k else nums[:]


def _merge_arrays(a, b):
    return sorted(a + b)


def _reverse_string(s):
    return s[::-1]


def _is_palindrome(s):
    t = [c.lower() for c in s if c.isalnum()]
    return t == t[::-1]


def _fizz_buzz(n):
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            out.append("FizzBuzz")
        elif i % 3 == 0:
            out.append("Fizz")
        elif i % 5 == 0:
            out.append("Buzz")
        else:
            out.append(str(i))
    return out


def _is_anagram(s, t):
    return sorted(s) == sorted(t)


def _longest_common_prefix(strs):
    if not strs:
        return ""
    pre = strs[0]
    for s in strs[1:]:
        while not s.startswith(pre):
            pre = pre[:-1]
            if not pre:
                return ""
    return pre


def _count_vowels(s):
    return sum(1 for c in s.lower() if c in "aeiou")


def _length_of_last_word(s):
    parts = s.split()
    return len(parts[-1]) if parts else 0


def _first_uniq_char(s):
    from collections import Counter
    c = Counter(s)
    for i, ch in enumerate(s):
        if c[ch] == 1:
            return i
    return -1


def _fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def _count_primes(n):
    if n < 3:
        return 0
    sieve = [True] * n
    sieve[0] = sieve[1] = False
    for i in range(2, int(n ** 0.5) + 1):
        if sieve[i]:
            for j in range(i * i, n, i):
                sieve[j] = False
    return sum(sieve)


def _is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0


def _gcd(a, b):
    return _math_gcd(a, b)


def _factorial(n):
    r = 1
    for i in range(2, n + 1):
        r *= i
    return r


def _digit_sum(n):
    return sum(int(c) for c in str(abs(n)))


def _reverse_integer(x):
    sign = -1 if x < 0 else 1
    return sign * int(str(abs(x))[::-1])


def _climb_stairs(n):
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def _rob(nums):
    prev = cur = 0
    for n in nums:
        prev, cur = cur, max(cur, prev + n)
    return cur


def _min_cost_climbing_stairs(cost):
    a = b = 0
    for c in cost:
        a, b = b, min(b, a) + c
    return min(a, b)


def _unique_paths(m, n):
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[-1]


def _coin_change(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i:
                dp[i] = min(dp[i], dp[i - c] + 1)
    return dp[amount] if dp[amount] != INF else -1


def _is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        else:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack


def _hamming_weight(n):
    return bin(n).count("1")


def _count_bits(n):
    return [bin(i).count("1") for i in range(n + 1)]


def _search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1


def _search_insert(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def _my_sqrt(x):
    if x < 2:
        return x
    lo, hi = 1, x
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= x:
            lo = mid + 1
        else:
            hi = mid - 1
    return hi


# ── raw problem definitions ───────────────────────────────────────────
# Each: (slug, title, topic, difficulty, fn, params, ref, inputs, description,
#        examples, constraints)
_RAW = [
    # ---- Arrays ----
    dict(slug="two-sum", title="Two Sum", topic="Arrays", difficulty="Easy",
         fn="two_sum", params=["nums", "target"], ref=_two_sum,
         inputs=[[[2, 7, 11, 15], 9], [[3, 2, 4], 6], [[3, 3], 6], [[1, 5, 8, 3], 11]],
         description="Given `nums` and a `target`, return the indices of the two numbers that add up to `target` (in increasing order). Exactly one solution exists.",
         examples=[{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]"}],
         constraints=["2 <= nums.length <= 10^4"]),
    dict(slug="max-subarray", title="Maximum Subarray", topic="Arrays", difficulty="Medium",
         fn="max_sub_array", params=["nums"], ref=_max_sub_array,
         inputs=[[[-2, 1, -3, 4, -1, 2, 1, -5, 4]], [[1]], [[5, 4, -1, 7, 8]], [[-1, -2, -3]]],
         description="Find the contiguous subarray with the largest sum and return that sum.",
         examples=[{"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6"}],
         constraints=["1 <= nums.length <= 10^5"]),
    dict(slug="contains-duplicate", title="Contains Duplicate", topic="Arrays", difficulty="Easy",
         fn="contains_duplicate", params=["nums"], ref=_contains_duplicate,
         inputs=[[[1, 2, 3, 1]], [[1, 2, 3, 4]], [[1, 1, 1, 1]], [[7]]],
         description="Return True if any value appears at least twice, else False.",
         examples=[{"input": "nums = [1,2,3,1]", "output": "true"}],
         constraints=["1 <= nums.length <= 10^5"]),
    dict(slug="move-zeroes", title="Move Zeroes", topic="Arrays", difficulty="Easy",
         fn="move_zeroes", params=["nums"], ref=_move_zeroes,
         inputs=[[[0, 1, 0, 3, 12]], [[0, 0, 1]], [[1, 2, 3]], [[0]]],
         description="Move all 0's to the end while keeping the order of non-zero elements. Return the resulting list.",
         examples=[{"input": "nums = [0,1,0,3,12]", "output": "[1,3,12,0,0]"}],
         constraints=["1 <= nums.length <= 10^4"]),
    dict(slug="best-time-stock", title="Best Time to Buy and Sell Stock", topic="Arrays", difficulty="Easy",
         fn="max_profit", params=["prices"], ref=_max_profit,
         inputs=[[[7, 1, 5, 3, 6, 4]], [[7, 6, 4, 3, 1]], [[1, 2]], [[2, 4, 1]]],
         description="Given daily `prices`, return the maximum profit from one buy and one later sell (0 if none).",
         examples=[{"input": "prices = [7,1,5,3,6,4]", "output": "5"}],
         constraints=["1 <= prices.length <= 10^5"]),
    dict(slug="single-number", title="Single Number", topic="Arrays", difficulty="Easy",
         fn="single_number", params=["nums"], ref=_single_number,
         inputs=[[[2, 2, 1]], [[4, 1, 2, 1, 2]], [[1]], [[7, 3, 7]]],
         description="Every element appears twice except one. Find that single one.",
         examples=[{"input": "nums = [4,1,2,1,2]", "output": "4"}],
         constraints=["1 <= nums.length <= 3*10^4"]),
    dict(slug="majority-element", title="Majority Element", topic="Arrays", difficulty="Easy",
         fn="majority_element", params=["nums"], ref=_majority_element,
         inputs=[[[3, 2, 3]], [[2, 2, 1, 1, 1, 2, 2]], [[1]], [[5, 5, 5, 1]]],
         description="Return the element that appears more than ⌊n/2⌋ times.",
         examples=[{"input": "nums = [2,2,1,1,1,2,2]", "output": "2"}],
         constraints=["A majority element always exists."]),
    dict(slug="product-except-self", title="Product of Array Except Self", topic="Arrays", difficulty="Medium",
         fn="product_except_self", params=["nums"], ref=_product_except_self,
         inputs=[[[1, 2, 3, 4]], [[-1, 1, 0, -3, 3]], [[2, 3]], [[5, 1, 1]]],
         description="Return an array where output[i] is the product of all elements except nums[i] (no division).",
         examples=[{"input": "nums = [1,2,3,4]", "output": "[24,12,8,6]"}],
         constraints=["2 <= nums.length <= 10^5"]),
    dict(slug="rotate-array", title="Rotate Array", topic="Arrays", difficulty="Medium",
         fn="rotate", params=["nums", "k"], ref=_rotate,
         inputs=[[[1, 2, 3, 4, 5, 6, 7], 3], [[-1, -100, 3, 99], 2], [[1, 2], 3], [[1], 0]],
         description="Rotate the array to the right by `k` steps and return it.",
         examples=[{"input": "nums = [1,2,3,4,5,6,7], k = 3", "output": "[5,6,7,1,2,3,4]"}],
         constraints=["1 <= nums.length <= 10^5", "0 <= k"]),
    dict(slug="merge-sorted-arrays", title="Merge Two Sorted Arrays", topic="Arrays", difficulty="Easy",
         fn="merge_arrays", params=["a", "b"], ref=_merge_arrays,
         inputs=[[[1, 3, 5], [2, 4, 6]], [[], [1, 2]], [[1, 2, 3], []], [[2, 2], [1, 3]]],
         description="Merge two sorted arrays into one sorted array and return it.",
         examples=[{"input": "a = [1,3,5], b = [2,4,6]", "output": "[1,2,3,4,5,6]"}],
         constraints=["0 <= a.length, b.length <= 10^4"]),

    # ---- Strings ----
    dict(slug="reverse-string", title="Reverse String", topic="Strings", difficulty="Easy",
         fn="reverse_string", params=["s"], ref=_reverse_string,
         inputs=[["hello"], ["CareerBoost"], [""], ["a"]],
         description="Return the reverse of the input string `s`.",
         examples=[{"input": 's = "hello"', "output": '"olleh"'}],
         constraints=["0 <= s.length <= 10^5"]),
    dict(slug="valid-palindrome", title="Valid Palindrome", topic="Strings", difficulty="Easy",
         fn="is_palindrome", params=["s"], ref=_is_palindrome,
         inputs=[["A man, a plan, a canal: Panama"], ["race a car"], [" "], ["ab_a"]],
         description="Return True if `s` reads the same forwards and backwards (consider only letters/digits, ignore case).",
         examples=[{"input": 's = "race a car"', "output": "false"}],
         constraints=["1 <= s.length <= 2*10^5"]),
    dict(slug="fizzbuzz", title="Fizz Buzz", topic="Strings", difficulty="Easy",
         fn="fizz_buzz", params=["n"], ref=_fizz_buzz,
         inputs=[[3], [5], [15]],
         description='Return a list for 1..n: "Fizz" for multiples of 3, "Buzz" for 5, "FizzBuzz" for both, else the number as a string.',
         examples=[{"input": "n = 5", "output": '["1","2","Fizz","4","Buzz"]'}],
         constraints=["1 <= n <= 10^4"]),
    dict(slug="valid-anagram", title="Valid Anagram", topic="Strings", difficulty="Easy",
         fn="is_anagram", params=["s", "t"], ref=_is_anagram,
         inputs=[["anagram", "nagaram"], ["rat", "car"], ["a", "a"], ["ab", "a"]],
         description="Return True if `t` is an anagram of `s`.",
         examples=[{"input": 's = "anagram", t = "nagaram"', "output": "true"}],
         constraints=["1 <= s.length, t.length <= 5*10^4"]),
    dict(slug="longest-common-prefix", title="Longest Common Prefix", topic="Strings", difficulty="Easy",
         fn="longest_common_prefix", params=["strs"], ref=_longest_common_prefix,
         inputs=[[["flower", "flow", "flight"]], [["dog", "racecar", "car"]], [["abc"]], [["a", "ab"]]],
         description="Return the longest common prefix among the array of strings (or empty string).",
         examples=[{"input": 'strs = ["flower","flow","flight"]', "output": '"fl"'}],
         constraints=["1 <= strs.length <= 200"]),
    dict(slug="count-vowels", title="Count Vowels", topic="Strings", difficulty="Easy",
         fn="count_vowels", params=["s"], ref=_count_vowels,
         inputs=[["hello"], ["xyz"], ["AEIOU"], [""]],
         description="Return the number of vowels (a, e, i, o, u) in `s`, case-insensitive.",
         examples=[{"input": 's = "hello"', "output": "2"}],
         constraints=["0 <= s.length <= 10^5"]),
    dict(slug="length-of-last-word", title="Length of Last Word", topic="Strings", difficulty="Easy",
         fn="length_of_last_word", params=["s"], ref=_length_of_last_word,
         inputs=[["Hello World"], ["   fly me   "], ["a"], ["luffy is here"]],
         description="Return the length of the last word in `s` (words are separated by spaces).",
         examples=[{"input": 's = "Hello World"', "output": "5"}],
         constraints=["1 <= s.length <= 10^4"]),
    dict(slug="first-unique-char", title="First Unique Character", topic="Strings", difficulty="Easy",
         fn="first_uniq_char", params=["s"], ref=_first_uniq_char,
         inputs=[["leetcode"], ["loveleetcode"], ["aabb"]],
         description="Return the index of the first non-repeating character, or -1.",
         examples=[{"input": 's = "leetcode"', "output": "0"}],
         constraints=["1 <= s.length <= 10^5"]),

    # ---- Math ----
    dict(slug="fibonacci", title="Fibonacci Number", topic="Math", difficulty="Easy",
         fn="fib", params=["n"], ref=_fib,
         inputs=[[0], [1], [6], [10]],
         description="Return the n-th Fibonacci number (fib(0)=0, fib(1)=1).",
         examples=[{"input": "n = 6", "output": "8"}],
         constraints=["0 <= n <= 30"]),
    dict(slug="count-primes", title="Count Primes", topic="Math", difficulty="Medium",
         fn="count_primes", params=["n"], ref=_count_primes,
         inputs=[[10], [0], [2], [20]],
         description="Return the number of primes strictly less than `n`.",
         examples=[{"input": "n = 10", "output": "4"}],
         constraints=["0 <= n <= 5*10^6"]),
    dict(slug="power-of-two", title="Power of Two", topic="Math", difficulty="Easy",
         fn="is_power_of_two", params=["n"], ref=_is_power_of_two,
         inputs=[[1], [16], [3], [0]],
         description="Return True if `n` is a power of two.",
         examples=[{"input": "n = 16", "output": "true"}],
         constraints=["-2^31 <= n <= 2^31 - 1"]),
    dict(slug="gcd", title="Greatest Common Divisor", topic="Math", difficulty="Easy",
         fn="gcd", params=["a", "b"], ref=_gcd,
         inputs=[[12, 18], [7, 5], [100, 10], [0, 9]],
         description="Return the greatest common divisor of `a` and `b`.",
         examples=[{"input": "a = 12, b = 18", "output": "6"}],
         constraints=["0 <= a, b <= 10^9"]),
    dict(slug="factorial", title="Factorial", topic="Math", difficulty="Easy",
         fn="factorial", params=["n"], ref=_factorial,
         inputs=[[0], [1], [5], [7]],
         description="Return n! (the factorial of n).",
         examples=[{"input": "n = 5", "output": "120"}],
         constraints=["0 <= n <= 20"]),
    dict(slug="digit-sum", title="Sum of Digits", topic="Math", difficulty="Easy",
         fn="digit_sum", params=["n"], ref=_digit_sum,
         inputs=[[123], [0], [9999], [10]],
         description="Return the sum of the digits of `n`.",
         examples=[{"input": "n = 123", "output": "6"}],
         constraints=["0 <= n <= 10^9"]),
    dict(slug="reverse-integer", title="Reverse Integer", topic="Math", difficulty="Medium",
         fn="reverse_integer", params=["x"], ref=_reverse_integer,
         inputs=[[123], [-456], [120], [0]],
         description="Return `x` with its digits reversed (keep the sign).",
         examples=[{"input": "x = -456", "output": "-654"}],
         constraints=["Assume the result fits in a normal integer."]),

    # ---- Dynamic Programming ----
    dict(slug="climbing-stairs", title="Climbing Stairs", topic="Dynamic Programming", difficulty="Easy",
         fn="climb_stairs", params=["n"], ref=_climb_stairs,
         inputs=[[2], [3], [5], [1]],
         description="You can climb 1 or 2 steps at a time. Return how many distinct ways to climb `n` steps.",
         examples=[{"input": "n = 3", "output": "3"}],
         constraints=["1 <= n <= 45"]),
    dict(slug="house-robber", title="House Robber", topic="Dynamic Programming", difficulty="Medium",
         fn="rob", params=["nums"], ref=_rob,
         inputs=[[[1, 2, 3, 1]], [[2, 7, 9, 3, 1]], [[5]], [[2, 1, 1, 2]]],
         description="You cannot rob two adjacent houses. Return the maximum amount you can rob.",
         examples=[{"input": "nums = [2,7,9,3,1]", "output": "12"}],
         constraints=["1 <= nums.length <= 100"]),
    dict(slug="min-cost-stairs", title="Min Cost Climbing Stairs", topic="Dynamic Programming", difficulty="Medium",
         fn="min_cost_climbing_stairs", params=["cost"], ref=_min_cost_climbing_stairs,
         inputs=[[[10, 15, 20]], [[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]], [[0, 0]], [[5, 5, 5]]],
         description="Each index has a cost. You can start at index 0 or 1 and climb 1 or 2 steps. Return the min cost to reach the top.",
         examples=[{"input": "cost = [10,15,20]", "output": "15"}],
         constraints=["2 <= cost.length <= 1000"]),
    dict(slug="unique-paths", title="Unique Paths", topic="Dynamic Programming", difficulty="Medium",
         fn="unique_paths", params=["m", "n"], ref=_unique_paths,
         inputs=[[3, 7], [3, 2], [1, 1], [3, 3]],
         description="A robot moves only right/down on an m×n grid. Return the number of unique paths from top-left to bottom-right.",
         examples=[{"input": "m = 3, n = 7", "output": "28"}],
         constraints=["1 <= m, n <= 100"]),
    dict(slug="coin-change", title="Coin Change", topic="Dynamic Programming", difficulty="Medium",
         fn="coin_change", params=["coins", "amount"], ref=_coin_change,
         inputs=[[[1, 2, 5], 11], [[2], 3], [[1], 0], [[1, 5, 10], 18]],
         description="Return the fewest number of coins to make `amount`, or -1 if impossible.",
         examples=[{"input": "coins = [1,2,5], amount = 11", "output": "3"}],
         constraints=["1 <= coins.length <= 12", "0 <= amount <= 10^4"]),

    # ---- Stack ----
    dict(slug="valid-parentheses", title="Valid Parentheses", topic="Stack", difficulty="Easy",
         fn="is_valid", params=["s"], ref=_is_valid,
         inputs=[["()"], ["()[]{}"], ["(]"], ["([)]"], ["{[]}"]],
         description="Given a string of brackets ()[]{} return True if they are validly matched and nested.",
         examples=[{"input": 's = "()[]{}"', "output": "true"}],
         constraints=["1 <= s.length <= 10^4"]),

    # ---- Bit Manipulation ----
    dict(slug="number-of-1-bits", title="Number of 1 Bits", topic="Bit Manipulation", difficulty="Easy",
         fn="hamming_weight", params=["n"], ref=_hamming_weight,
         inputs=[[11], [128], [255], [0]],
         description="Return the number of '1' bits in the binary representation of `n`.",
         examples=[{"input": "n = 11", "output": "3"}],
         constraints=["0 <= n <= 2^31 - 1"]),
    dict(slug="counting-bits", title="Counting Bits", topic="Bit Manipulation", difficulty="Easy",
         fn="count_bits", params=["n"], ref=_count_bits,
         inputs=[[2], [5], [0]],
         description="Return a list `ans` of length n+1 where ans[i] is the number of 1 bits in i.",
         examples=[{"input": "n = 5", "output": "[0,1,1,2,1,2]"}],
         constraints=["0 <= n <= 10^5"]),

    # ---- Searching ----
    dict(slug="binary-search", title="Binary Search", topic="Searching", difficulty="Easy",
         fn="search", params=["nums", "target"], ref=_search,
         inputs=[[[-1, 0, 3, 5, 9, 12], 9], [[-1, 0, 3, 5, 9, 12], 2], [[5], 5], [[2, 4, 6, 8, 10], 8]],
         description="Given a sorted ascending array and a target, return its index or -1.",
         examples=[{"input": "nums = [-1,0,3,5,9,12], target = 9", "output": "4"}],
         constraints=["1 <= nums.length <= 10^4"]),
    dict(slug="search-insert-position", title="Search Insert Position", topic="Searching", difficulty="Easy",
         fn="search_insert", params=["nums", "target"], ref=_search_insert,
         inputs=[[[1, 3, 5, 6], 5], [[1, 3, 5, 6], 2], [[1, 3, 5, 6], 7], [[1, 3, 5, 6], 0]],
         description="Return the index where `target` is found, or the index where it would be inserted in order.",
         examples=[{"input": "nums = [1,3,5,6], target = 2", "output": "1"}],
         constraints=["1 <= nums.length <= 10^4"]),
    dict(slug="sqrt", title="Sqrt (integer)", topic="Searching", difficulty="Easy",
         fn="my_sqrt", params=["x"], ref=_my_sqrt,
         inputs=[[4], [8], [0], [1], [144]],
         description="Return the floor of the square root of `x` (integer result).",
         examples=[{"input": "x = 8", "output": "2"}],
         constraints=["0 <= x <= 2^31 - 1"]),
]


# ── generated problem families (auto-verified, to scale up the count) ──
def _is_power_of_base(n, b):
    if n < 1:
        return False
    while n % b == 0:
        n //= b
    return n == 1


def _fmt_args(params, args):
    return ", ".join(f"{p} = {a!r}" for p, a in zip(params, args))


def _gen(slug, title, topic, fn, params, ref, inputs, description, difficulty="Easy"):
    ex_out = _jsonify(ref(*copy.deepcopy(inputs[0])))
    return dict(
        slug=slug, title=title, topic=topic, difficulty=difficulty,
        fn=fn, params=params, ref=ref, inputs=inputs,
        description=description,
        examples=[{"input": _fmt_args(params, inputs[0]), "output": str(ex_out)}],
        constraints=["Auto-generated practice problem."],
    )


def _generate():
    out = []

    # A) Evaluate a quadratic  a*x^2 + b*x + c   (100 problems)
    for a in range(1, 6):
        for b in range(0, 5):
            for c in range(0, 4):
                out.append(_gen(
                    f"poly-{a}-{b}-{c}", f"Evaluate {a}x² + {b}x + {c}", "Math",
                    "evaluate", ["x"],
                    (lambda x, a=a, b=b, c=c: a * x * x + b * x + c),
                    [[0], [1], [2], [5], [-1]],
                    f"Given an integer `x`, return {a}*x*x + {b}*x + {c}.",
                ))

    # B) Sum of multiples of k below n   (50)
    for k in range(2, 52):
        out.append(_gen(
            f"summult-{k}", f"Sum of Multiples of {k} Below n", "Math",
            "sum_multiples", ["n"],
            (lambda n, k=k: sum(range(k, n, k))),
            [[10], [20], [1], [100]],
            f"Return the sum of all positive multiples of {k} that are strictly less than `n`.",
        ))

    # C) Count numbers in a list divisible by k   (50)
    for k in range(2, 52):
        out.append(_gen(
            f"countdiv-{k}", f"Count Numbers Divisible by {k}", "Arrays",
            "count_divisible", ["nums"],
            (lambda nums, k=k: sum(1 for v in nums if v % k == 0)),
            [[[2, 4, 6, 7, 9, 12]], [[1, 3, 5]], [[10, 20, 30]], [[k, 2 * k, 1]]],
            f"Return how many numbers in the list `nums` are divisible by {k}.",
        ))

    # D) First k multiples of n   (40)
    for k in range(2, 42):
        out.append(_gen(
            f"firstmult-{k}", f"First {k} Multiples of n", "Math",
            "first_multiples", ["n"],
            (lambda n, k=k: [n * i for i in range(1, k + 1)]),
            [[3], [5], [1]],
            f"Return a list of the first {k} positive multiples of `n` (i.e. n, 2n, …).",
        ))

    # E) Repeat a string k times   (40)
    for k in range(2, 42):
        out.append(_gen(
            f"repeat-{k}", f"Repeat String {k} Times", "Strings",
            "repeat_string", ["s"],
            (lambda s, k=k: s * k),
            [["ab"], ["x"], [""]],
            f"Return the string `s` repeated {k} times.",
        ))

    # F) Count a specific character in a string   (26)
    for c in "abcdefghijklmnopqrstuvwxyz":
        out.append(_gen(
            f"countchar-{c}", f"Count '{c}' in String", "Strings",
            "count_char", ["s"],
            (lambda s, c=c: s.count(c)),
            [["banana"], ["mississippi"], ["xyz"]],
            f"Return how many times the character '{c}' appears in `s`.",
        ))

    # G) n mod m   (50)
    for m in range(2, 52):
        out.append(_gen(
            f"mod-{m}", f"Compute n mod {m}", "Math",
            "mod_value", ["n"],
            (lambda n, m=m: n % m),
            [[10], [7], [100], [0]],
            f"Return the remainder when `n` is divided by {m}.",
        ))

    # H) Is n a power of b   (30)
    for b in range(2, 32):
        out.append(_gen(
            f"powerof-{b}", f"Is n a Power of {b}?", "Math",
            "is_power_of", ["n"],
            (lambda n, b=b: _is_power_of_base(n, b)),
            [[1], [b], [b * b], [7], [0]],
            f"Return True if `n` is a (non-negative integer) power of {b}, else False.",
        ))

    # I) Arithmetic sequence n-th term   (100)
    for a in range(1, 11):
        for d in range(1, 11):
            out.append(_gen(
                f"arith-{a}-{d}", f"Arithmetic Term (start {a}, step {d})", "Math",
                "nth_term", ["n"],
                (lambda n, a=a, d=d: a + (n - 1) * d),
                [[1], [2], [5], [10]],
                f"An arithmetic sequence starts at {a} and increases by {d} each time. "
                f"Return the n-th term (1-indexed).",
            ))

    return out


# ── build the public problem list (compute expected outputs from ref) ──
def _build(raw):
    out = []
    for r in raw:
        tests = []
        for inp in r["inputs"]:
            args = copy.deepcopy(inp)
            expected = _jsonify(r["ref"](*args))
            tests.append({"input": inp, "output": expected})
        out.append({
            "slug": r["slug"],
            "title": r["title"],
            "topic": r["topic"],
            "difficulty": r["difficulty"],
            "description": r["description"],
            "examples": r["examples"],
            "constraints": r["constraints"],
            "function_name": r["fn"],
            "starter": _starter(r["fn"], r["params"]),
            "tests": tests,
        })
    return out


PROBLEMS = _build(_RAW + _generate())
PROBLEMS_BY_SLUG = {p["slug"]: p for p in PROBLEMS}


def list_problems():
    return [
        {"slug": p["slug"], "title": p["title"], "topic": p["topic"], "difficulty": p["difficulty"]}
        for p in PROBLEMS
    ]


def topics_with_counts():
    counts = {}
    for p in PROBLEMS:
        counts[p["topic"]] = counts.get(p["topic"], 0) + 1
    return [{"topic": t, "count": c} for t, c in sorted(counts.items())]
