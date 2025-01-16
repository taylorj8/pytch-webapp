import React from "react";
import { useStoreState } from "../store";
import { AssetPresentation } from "../model/asset";
import Button from "react-bootstrap/Button";
import { useRunFlow } from "../model";
import { NoContentHelp } from "./Junior/NoContentHelp";
import { SingleTab } from "./SingleTab";
import { AssetCard as JrAssetCard } from "./Junior/AssetCard";
import { AssetMetaDataOps } from "../model/junior/structured-program";

type AssetCardProps = {
  asset: AssetPresentation;
};
const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const assetKind = AssetMetaDataOps.mimeAssetKind(asset.mimeType);
  return (
    <JrAssetCard
      operationScope="flat"
      assetKind={assetKind}
      assetPresentation={asset}
      canBeDeleted={true}
      displayIndex={null}
    />
  );
};

export const ProjectAssetList = () => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const loadState = useStoreState(
    (state) => state.activeProject.syncState.loadState
  );
  const assets = useStoreState((state) => state.activeProject.project.assets);

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);
  const operationContextKey = "flat/any" as const;
  const launchUploadModal = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix: "" });

  const runAddClipArt = useRunFlow((f) => f.addClipArtFlow);

  const launchClipArtModal = () =>
    runAddClipArt({ projectId, operationContextKey, assetNamePrefix: "" });

  switch (loadState) {
    case "pending":
      return <div>Assets loading....</div>;
    case "failed":
      // TODO: Handle more usefully
      return <div>Assets failed to load, oh no</div>;
    case "succeeded":
      break; // Handle normal case below.
    default:
      throw new Error(`unknown loadState "${loadState}"`);
  }

  const maybeNoContentHelp = assets.length === 0 && (
    <NoContentHelp
      actorKind="project"
      contentKind="images or sounds"
      buttonsPlural={true}
    />
  );

  // TODO: Should we split this into two tabs: Images, Sounds?
  return (
    <div className="AssetCardPane-container compact-tablist-container">
      <SingleTab title="Images and sounds">
        <div className="abs-0000">
          <div className="AssetCardPane">
            {maybeNoContentHelp}
            <div className="AssetCardList">
              {assets.map((asset) => (
                <AssetCard key={asset.name} asset={asset} />
              ))}
            </div>
            <div className="buttons">
              <Button className="assets-button" onClick={launchUploadModal}>
                Add an image or sound
              </Button>
              or
              <Button className="assets-button" onClick={launchClipArtModal}>
                Choose from library
              </Button>
            </div>
          </div>
        </div>
      </SingleTab>
    </div>
  );
};
