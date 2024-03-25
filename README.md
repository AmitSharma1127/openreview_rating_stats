# Openreview.net Rating Stats
Simple aggregation of ratings on openreview.net.

### Usefulness
Simply give the main url of the venue and the script will scrape all the URLs of the reviews from all the pages of the given venue.

Instantly get a JSON file containing URL of the review, all the preliminary ratings, and an average of all the ratings per URL.

This script aims to assist in understanding the general sentiment and quality of feedback within specified academic venue.

### Usage
```
# install all dependencies
npm i

# start scrapping and generate JSON
node main.js --openreview_main_url='https://openreview.net/group?id=MIDL.io/2024/Conference#tab-active-submissions' --venue_name=MIDL
```

**Output**
```
{
  "paper_url_1": {
    "preiminary_ratings": [3, 2, 1],
    "average_rating": "2.00"
  },
  "paper_url_2": {
    "preiminary_ratings": [2, 4, 2],
    "average_rating": "2.67"
  },
  "paper_url_3": {
    "preiminary_ratings": [1, 4, 1],
    "average_rating": "2.00"
  },
  ...
}
```

### Disclaimer
This is a simple script designed to provide a summary analysis of the reviews from specific conference or venue hosted on OpenReview, with the intention of offering a general overview of the review trends for researchers, authors, and participants interested in the academic quality and focus areas of the conference.

