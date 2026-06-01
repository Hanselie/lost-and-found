/**
 * BINUS Lost & Found — Fuzzy Search Engine
 * 
 * A powerful client-side elastic search that handles:
 * - Typos (e.g. "elktronik" → "Elektronik")
 * - Missing characters (e.g. "elektrnk" → "Elektronik")
 * - Extra characters (e.g. "elektroniik" → "Elektronik")
 * - Partial matches (e.g. "elek" → "Elektronik")
 * - Multi-keyword AND logic (e.g. "tas anggrek" → items with "Tas" AND "Anggrek")
 * - Case insensitive
 * 
 * Algorithm: Combination of
 *   1. Levenshtein Distance (edit distance for typo tolerance)
 *   2. Trigram Similarity (partial/substring fuzzy matching)
 *   3. Prefix Matching (autocomplete-style)
 *   4. Substring Containment (exact match bonus)
 *   5. Scoring & Threshold system
 */

var FuzzySearch = (function () {

  // ─── Levenshtein Distance ───
  // Number of single-character edits (insert, delete, substitute) to transform a → b
  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    // Optimization: if strings are identical
    if (a === b) return 0;

    var matrix = [];
    var i, j;

    for (i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,      // insertion
            matrix[i - 1][j] + 1       // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // ─── Trigram Generator ───
  // Splits a string into overlapping 3-character chunks for fuzzy comparison
  function trigrams(str) {
    var padded = '  ' + str + '  ';
    var result = [];
    for (var i = 0; i < padded.length - 2; i++) {
      result.push(padded.substring(i, i + 3));
    }
    return result;
  }

  // ─── Trigram Similarity (Dice coefficient) ───
  // Returns 0..1 score based on shared trigrams
  function trigramSimilarity(a, b) {
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    var triA = trigrams(a);
    var triB = trigrams(b);
    var setB = {};
    var shared = 0;

    for (var i = 0; i < triB.length; i++) {
      setB[triB[i]] = (setB[triB[i]] || 0) + 1;
    }

    for (var j = 0; j < triA.length; j++) {
      if (setB[triA[j]] && setB[triA[j]] > 0) {
        shared++;
        setB[triA[j]]--;
      }
    }

    return (2.0 * shared) / (triA.length + triB.length);
  }

  // ─── Normalized Levenshtein Similarity ───
  // Returns 0..1 (1 = identical, 0 = completely different)
  function levenshteinSimilarity(a, b) {
    var maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - (levenshtein(a, b) / maxLen);
  }

  // ─── Score a single keyword against a single target word ───
  // Returns 0..1 fuzzy relevance score
  function scoreKeywordAgainstWord(keyword, word) {
    // Perfect match
    if (word === keyword) return 1.0;

    // Contains exact substring (very strong signal)
    if (word.indexOf(keyword) !== -1) return 0.95;

    // Starts with keyword (prefix match, like autocomplete)
    if (word.indexOf(keyword) === 0) return 0.93;

    // Keyword starts with word (user typed more than needed)
    if (keyword.indexOf(word) !== -1) return 0.8;

    var scores = [];

    // Levenshtein similarity (great for typos: 1-2 character edits)
    var levSim = levenshteinSimilarity(keyword, word);
    scores.push(levSim);

    // Trigram similarity (great for partial matches and longer strings)
    var triSim = trigramSimilarity(keyword, word);
    scores.push(triSim);

    // For short keywords (1-3 chars), also try matching against each word segment
    if (keyword.length <= 3 && word.length > 3) {
      for (var i = 0; i <= word.length - keyword.length; i++) {
        var segment = word.substring(i, i + keyword.length);
        if (segment === keyword) return 0.85;
      }
    }

    // Return the best score from all methods
    return Math.max.apply(null, scores);
  }

  // ─── Score a single keyword against a full text field ───
  // The field may contain multiple words; we check against each word individually
  // and also against the full string as a whole
  function scoreKeywordAgainstField(keyword, fieldText) {
    if (!fieldText) return 0;

    var fieldLower = fieldText.toLowerCase();

    // Direct substring check (strongest signal for multi-word fields)
    if (fieldLower.indexOf(keyword) !== -1) return 1.0;

    // Split field into individual words and check each
    var words = fieldLower.split(/[\s\-\/\,\.]+/).filter(function (w) { return w.length > 0; });
    var bestWordScore = 0;

    for (var i = 0; i < words.length; i++) {
      var s = scoreKeywordAgainstWord(keyword, words[i]);
      if (s > bestWordScore) bestWordScore = s;
    }

    // Also try against the full concatenated field (for multi-word matching)
    var fullScore = scoreKeywordAgainstWord(keyword, fieldLower);

    return Math.max(bestWordScore, fullScore);
  }

  // ─── Score a single keyword against all fields of an item ───
  // Returns best score across all fields
  function scoreKeywordAgainstItem(keyword, fields) {
    var bestScore = 0;

    for (var i = 0; i < fields.length; i++) {
      var s = scoreKeywordAgainstField(keyword, fields[i]);
      if (s > bestScore) bestScore = s;
    }

    return bestScore;
  }

  // ─── Main Search Function ───
  // query: the search string typed by user
  // items: array of objects
  // fieldExtractor: function(item) → array of string field values to search
  // threshold: minimum score to include (default 0.35)
  // Returns: filtered & sorted array of { item, score }
  function search(query, items, fieldExtractor, threshold) {
    if (!query || query.trim().length === 0) {
      return items.map(function (item) { return { item: item, score: 1 }; });
    }

    threshold = threshold !== undefined ? threshold : 0.35;

    var keywords = query.toLowerCase().trim().split(/\s+/).filter(function (k) { return k.length > 0; });

    if (keywords.length === 0) {
      return items.map(function (item) { return { item: item, score: 1 }; });
    }

    var results = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var fields = fieldExtractor(item);
      var totalScore = 0;
      var allKeywordsPass = true;

      for (var k = 0; k < keywords.length; k++) {
        var kwScore = scoreKeywordAgainstItem(keywords[k], fields);

        if (kwScore < threshold) {
          allKeywordsPass = false;
          break;
        }

        totalScore += kwScore;
      }

      if (allKeywordsPass) {
        // Average score across all keywords
        var avgScore = totalScore / keywords.length;
        results.push({ item: item, score: avgScore });
      }
    }

    // Sort by score descending (most relevant first)
    results.sort(function (a, b) { return b.score - a.score; });

    return results;
  }

  // ─── Convenience: just return the items (without scores) ───
  function filter(query, items, fieldExtractor, threshold) {
    var scored = search(query, items, fieldExtractor, threshold);
    return scored.map(function (r) { return r.item; });
  }

  // Public API
  return {
    levenshtein: levenshtein,
    trigramSimilarity: trigramSimilarity,
    search: search,
    filter: filter
  };

})();
