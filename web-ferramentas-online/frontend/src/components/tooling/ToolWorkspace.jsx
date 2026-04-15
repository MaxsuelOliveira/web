import GeneratorToolView from "../../modules/tools/generators/GeneratorToolView";
import LookupToolView from "../../modules/tools/lookup/LookupToolView";
import TesterToolView from "../../modules/tools/testers/TesterToolView";
import TextToolView from "../../modules/tools/text/TextToolView";

export default function ToolWorkspace({ tool }) {
  if (tool.family === "lookup") {
    return <LookupToolView tool={tool} />;
  }

  if (tool.family === "generator") {
    return <GeneratorToolView tool={tool} />;
  }

  if (tool.family === "tester") {
    return <TesterToolView tool={tool} />;
  }

  return <TextToolView tool={tool} />;
}
