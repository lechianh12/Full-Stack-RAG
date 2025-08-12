from llm import llm
from langgraph.prebuilt import create_react_agent
from tools import rag_tool, list_collections
from config.config import Config


config = Config()

class Agent:
    def __init__(self, 
                 llm = llm, 
                 tools = [rag_tool, list_collections], 
                 system_prompt = config.SYSTEM_MESSAGE):
        self.llm = llm
        self.tools = tools
        self.system_prompt = system_prompt

        
        self.agent = create_react_agent(
            model=self.llm,
            tools=self.tools,
            prompt=self.system_prompt
        )

    def run(self, prompt: str):
        output = self.agent.invoke({"messages": [{"role": "user", "content": prompt}]})
        return output['messages'][-1].content
        
    def debug(self, prompt: str) -> None:
        print("SYSTEM MESSAGE: ",self.system_prompt)
        
        for step in self.agent.stream(
            {"messages": [{"role": "user", "content": prompt}]},
            stream_mode="values",
        ):
            step["messages"][-1].pretty_print()

agent = Agent()

question = "FastAPI là gì?"
response = agent.run(question)
print("Response:", response)













