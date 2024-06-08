import { Action, ActionPanel, List, Toast, showToast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

import _ from "lodash";
import algoliaSearch from "algoliasearch";

const APPID = "KXECYAMEX8";
const APIKEY = "01279e9ede105d87a1ade54565b1a2fd";
const INDEX = "adonisjs_next";

type result = {
  url: string;
  anchor: string;
  body: string;
  objectID: string;
  hierarchy: {
    [key: string]: string;
  };
  _highlightResult: {
    content:
      | {
          value: string;
          matchlevel: string;
          fullyHighlighted: boolean;
          matchedWords: string[];
        }
      | undefined;
    hierarchy: {
      [key: string]: {
        value: string;
        matchLevel: string;
        matchedWords: string[];
      };
    };
  };
};

export default function SearchDocumentation() {
  const algoliaClient = useMemo(() => {
    return algoliaSearch(APPID, APIKEY);
  }, [APPID, APIKEY]);

  const algoliaIndex = useMemo(() => {
    return algoliaClient.initIndex(INDEX);
  }, [algoliaClient, INDEX]);

  const [searchResults, setSearchResults] = useState<any[] | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const search = async (query = "api") => {
    setIsLoading(true);
    !query && (query = "api");

    return await algoliaIndex
      .search(query, {
        hitsPerPage: 15,
      })
      .then((res) => {
        return Object.entries(_.groupBy(res.hits, "hierarchy.lvl1")) || [];
      })
      .catch((err) => {
        showToast(Toast.Style.Failure, "Error searching AdonisJS documentation", err.message);
        return [];
      });
  };

  useEffect(() => {
    (async () => {
      setSearchResults(await search());
      setIsLoading(false);
    })();
  }, []);

  return (
    <List
      throttle={true}
      isLoading={isLoading}
      searchBarPlaceholder={"Search AdonisJS Documentation"}
      onSearchTextChange={async (query) => {
        setSearchResults(await search(query));
        setIsLoading(false);
      }}
    >
      {searchResults?.map(([hitType, hitTypeResults]) => (
        <List.Section title={hitType} key={hitType}>
          {hitTypeResults
            ?.filter((hit: { hierarchy: { lvl2: null } }) => hit.hierarchy.lvl2 != null)
            .map((hit: result) => (
              <List.Item
                id={hit.objectID}
                key={hit.objectID}
                icon="adonis-logo.png"
                title={(
                  (hit.hierarchy.lvl2 != null ? hit.hierarchy.lvl2 : "") +
                  " " +
                  (hit.hierarchy.lvl3 != null ? hit.hierarchy.lvl3 : "") +
                  " " +
                  (hit.hierarchy.lvl4 != null ? hit.hierarchy.lvl4 : "") +
                  " " +
                  (hit.hierarchy.lvl5 != null ? hit.hierarchy.lvl5 : "") +
                  " " +
                  (hit.hierarchy.lvl6 != null ? hit.hierarchy.lvl6 : "")
                ).replace("&amp;", "&")}
                actions={
                  <ActionPanel title="Actions">
                    <Action.OpenInBrowser url={hit.url} />
                    <Action.CopyToClipboard content={hit.url} title="Copy URL" />
                  </ActionPanel>
                }
              />
            ))}
        </List.Section>
      ))}
      <List.EmptyView icon="adonis-logo-128.png" title="Whoops! We did not find any matches." />
    </List>
  );
}