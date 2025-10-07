import StaticSkillTree from "@components/resources/skill-tree/skill-tree";
import { TOPICS, PREREQS } from "./dataset";
export default function SkillTreePage() {
    return (
        <div className="grid h-screen place-items-center">
            <StaticSkillTree
                direction="LR"
                topicData={TOPICS}
                preReqData={PREREQS}
            />
        </div>
    );
}
